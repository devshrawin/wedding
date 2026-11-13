import type { Contribution, Reservation } from "./db/schema";
import type { ItemView } from "./compute";

/** One row of the shagun ledger: money received, or a gift someone reserved. */
export type Entry = {
  kind: "contribution" | "reservation";
  id: string;
  name: string | null;
  phone: string | null;
  place: string | null;
  message: string | null;
  anonymous: boolean;
  amount: number | null;
  /** estimated value for reserved gifts */
  value: number | null;
  itemTitle: string | null;
  isFund: boolean;
  method: "upi" | "razorpay" | "cash" | "gift";
  status: string;
  utr: string | null;
  thanked: boolean;
  createdAt: string;
};

export function buildEntries(items: ItemView[], reservations: Reservation[], contributions: Contribution[]): Entry[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: Entry[] = [];
  for (const c of contributions) {
    const item = c.itemId ? byId.get(c.itemId) : undefined;
    out.push({
      kind: "contribution",
      id: c.id,
      name: c.guestName,
      phone: c.guestPhone,
      place: c.guestPlace,
      message: c.message,
      anonymous: c.anonymous,
      amount: c.amount,
      value: c.amount,
      itemTitle: item?.title ?? c.itemTitle,
      isFund: item ? item.kind === "fund" : true,
      method: c.method as Entry["method"],
      status: c.status,
      utr: c.utr,
      thanked: Boolean(c.thankedAt),
      createdAt: c.createdAt.toISOString(),
    });
  }
  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const item = byId.get(r.itemId);
    out.push({
      kind: "reservation",
      id: r.id,
      name: r.guestName,
      phone: r.guestPhone,
      place: null,
      message: r.message,
      anonymous: r.anonymous,
      amount: null,
      value: item?.price ? item.price * r.quantity : null,
      itemTitle: item ? (r.quantity > 1 ? `${item.title} × ${r.quantity}` : item.title) : null,
      isFund: false,
      method: "gift",
      status: r.status,
      utr: null,
      thanked: Boolean(r.thankedAt),
      createdAt: r.createdAt.toISOString(),
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function methodLabel(e: Entry, tr: (en: string, hi: string) => string): string {
  if (e.method === "gift") return e.status === "purchased" ? tr("Gift · bought", "तोहफ़ा · ख़रीद लिया") : tr("Gift · reserved", "तोहफ़ा · चुना गया");
  if (e.method === "cash") return e.status === "pending" ? tr("Will give in person", "ख़ुद आकर देंगे") : tr("Cash", "नकद");
  if (e.method === "razorpay") return tr("Online", "ऑनलाइन");
  return "UPI";
}

export function guestLabel(e: Entry, tr: (en: string, hi: string) => string): string {
  return e.name || (e.anonymous ? tr("Anonymous well-wisher", "गुमनाम शुभचिंतक") : tr("Guest", "मेहमान"));
}
