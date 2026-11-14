import type { Contribution, Item, Reservation } from "./db/schema";

export type ItemView = Item & {
  reservedQty: number;
  /** confirmed money */
  raised: number;
  /** guest says paid / pledged, couple hasn't confirmed yet */
  pendingAmount: number;
  remainingQty: number;
  target: number | null;
  fulfilled: boolean;
  /** 0–100 */
  progress: number;
  givers: number;
  /** chip-in gifts only: amount guests can still pledge (null otherwise) */
  chipInLeft: number | null;
};

/** Money still needed on a chip-in gift: target minus confirmed and pending (unverified) amounts. */
export function chipInRemaining(target: number, given: { amount: number; status: string }[]): number {
  const taken = given.filter((c) => c.status === "confirmed" || c.status === "pending").reduce((s, c) => s + c.amount, 0);
  return Math.max(0, target - taken);
}

export const isActiveReservation = (r: Reservation) => r.status !== "cancelled";
export const countsTowardTotal = (c: Contribution) => c.status === "confirmed";
export const isLiveContribution = (c: Contribution) => c.status === "confirmed" || c.status === "pending";

export function computeItems(items: Item[], reservations: Reservation[], contributions: Contribution[]): ItemView[] {
  return [...items]
    .sort((a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime())
    .map((item) => {
      const res = reservations.filter((r) => r.itemId === item.id && isActiveReservation(r));
      const con = contributions.filter((c) => c.itemId === item.id);
      const reservedQty = res.reduce((s, r) => s + r.quantity, 0);
      const raised = con.filter(countsTowardTotal).reduce((s, c) => s + c.amount, 0);
      const pendingAmount = con.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);
      const target = item.kind === "fund" ? item.price : item.price ? item.price * item.quantity : null;
      const remainingQty = Math.max(0, item.quantity - reservedQty);
      let fulfilled: boolean;
      let progress: number;
      if (item.kind === "fund") {
        fulfilled = target != null && raised >= target;
        progress = target ? Math.min(100, Math.round((raised / target) * 100)) : 0;
      } else {
        const moneyDone = target != null && raised >= target;
        fulfilled = remainingQty === 0 || moneyDone;
        const byQty = (reservedQty / item.quantity) * 100;
        const byMoney = target ? (raised / target) * 100 : 0;
        progress = fulfilled ? 100 : Math.min(100, Math.round(Math.max(byQty, byMoney)));
      }
      return {
        ...item,
        reservedQty,
        raised,
        pendingAmount,
        remainingQty,
        target,
        fulfilled,
        progress,
        givers: res.length + con.filter(isLiveContribution).length,
        chipInLeft: item.kind === "product" && item.allowChipIn && target != null ? chipInRemaining(target, con) : null,
      };
    });
}

export type Stats = {
  cashReceived: number;
  cashPending: number;
  giftsValue: number;
  totalReceived: number;
  wishlistValue: number;
  fulfilledPct: number;
  itemsTotal: number;
  itemsFulfilled: number;
  pendingCount: number;
  guests: number;
  toThank: number;
};

export function computeStats(views: ItemView[], reservations: Reservation[], contributions: Contribution[]): Stats {
  const confirmed = contributions.filter(countsTowardTotal);
  const pending = contributions.filter((c) => c.status === "pending");
  const activeRes = reservations.filter(isActiveReservation);
  const priceOf = new Map(views.map((v) => [v.id, v.price ?? 0]));

  const cashReceived = confirmed.reduce((s, c) => s + c.amount, 0);
  const giftsValue = activeRes.reduce((s, r) => s + (priceOf.get(r.itemId) ?? 0) * r.quantity, 0);

  // Progress is measured against things with a known goal (products + targeted funds).
  const goals = views.filter((v) => v.target != null);
  const wishlistValue = goals.reduce((s, v) => s + (v.target ?? 0), 0);
  const covered = goals.reduce((s, v) => {
    const t = v.target ?? 0;
    if (v.kind === "fund") return s + Math.min(t, v.raised);
    const byQty = v.reservedQty * (v.price ?? 0);
    return s + Math.min(t, byQty + v.raised);
  }, 0);

  const people = new Set<string>();
  for (const c of contributions.filter(isLiveContribution)) people.add(c.guestKey || c.id);
  for (const r of activeRes) people.add(r.guestKey);

  return {
    cashReceived,
    cashPending: pending.reduce((s, c) => s + c.amount, 0),
    giftsValue,
    totalReceived: cashReceived + giftsValue,
    wishlistValue,
    fulfilledPct: wishlistValue ? Math.round((covered / wishlistValue) * 100) : 0,
    itemsTotal: views.length,
    itemsFulfilled: views.filter((v) => v.fulfilled).length,
    pendingCount: pending.length,
    guests: people.size,
    toThank: confirmed.filter((c) => !c.thankedAt).length + activeRes.filter((r) => !r.thankedAt).length,
  };
}

// ── Thank-you notes ───────────────────────────────────────────────────

export type Tone = "warm" | "formal" | "fun";

export function thankYouNote(p: {
  lang: "en" | "hi";
  tone: Tone;
  guest: string | null;
  gift: string | null; // item title for a reserved gift
  amount: number | null; // for cash
  fund: string | null;
  couple: string;
  /** the couple's word for gift money ("Shagun", "Gift"…); defaults to neutral wording */
  word?: string | null;
}): string {
  const name = p.guest?.trim();
  // The default "Gifts & blessings" fund reads oddly in a sentence; leave it out.
  if (p.fund && /blessings|आशीर्वाद/i.test(p.fund)) p = { ...p, fund: null };
  const amt = p.amount ? "₹" + p.amount.toLocaleString("en-IN") : null;
  if (p.lang === "hi") {
    const hello = name ? `${name} जी,` : "नमस्ते,";
    const what = p.gift
      ? `आपने हमारे लिए “${p.gift}” चुना`
      : p.fund && amt
        ? `आपने “${p.fund}” के लिए ${amt} का ${p.word || "तोहफ़ा"} भेजा`
        : amt
          ? `आपने ${amt} का ${p.word || "तोहफ़ा"} भेजा`
          : "आपने इतना प्यारा तोहफ़ा भेजा";
    if (p.tone === "formal")
      return `${hello}\n\n${what}, इसके लिए हम हृदय से आभारी हैं। आपका आशीर्वाद हमारे नए जीवन की सबसे बड़ी पूँजी है।\n\nसादर प्रणाम,\n${p.couple}`;
    if (p.tone === "fun")
      return `${hello} 🎉\n\n${what}, सच में, दिल खुश हो गया! अब घर आइए, चाय हमारी तरफ़ से पक्की। ☕\n\nढेर सारा प्यार,\n${p.couple}`;
    return `${hello}\n\n${what}, दिल से धन्यवाद। आपका प्यार और आशीर्वाद हमारे लिए बहुत मायने रखता है। जल्द ही मिलते हैं!\n\nसप्रेम,\n${p.couple}`;
  }
  const hello = name ? `Dear ${name},` : "Hello,";
  const what = p.gift
    ? `the ${p.gift}`
    : p.fund && amt
      ? `your ${p.word ? p.word.toLowerCase() : "gift"} of ${amt} towards our ${p.fund}`
      : amt
        ? `your ${p.word ? p.word.toLowerCase() : "gift"} of ${amt}`
        : "your lovely gift";
  if (p.tone === "formal")
    return `${hello}\n\nThank you so much for ${what}. We are truly grateful for your blessings as we begin our new life together.\n\nWith warm regards,\n${p.couple}`;
  if (p.tone === "fun")
    return `${hello} 🎉\n\nYou're the best! Thank you for ${what}. It made our day. Chai's on us when you visit the new home! ☕\n\nLots of love,\n${p.couple}`;
  return `${hello}\n\nThank you from the bottom of our hearts for ${what}. Your love and blessings mean the world to us. Can't wait to see you soon!\n\nWith love,\n${p.couple}`;
}
