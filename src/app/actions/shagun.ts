"use server";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/ids";
import { fail, type Result } from "@/lib/result";
import { normalizePhone } from "@/lib/utils";
import { manage } from "@/lib/manage";

export async function setContributionStatus(slug: string, id: string, status: "confirmed" | "rejected" | "pending"): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  const where = and(eq(schema.contributions.id, id), eq(schema.contributions.registryId, m.registry.id));
  const [row] = await db.select().from(schema.contributions).where(where).limit(1);
  if (!row) return fail("notfound");
  // Razorpay payments are settled by the gateway, never by hand.
  if (row.method === "razorpay") return fail("invalid");
  await db.update(schema.contributions).set({ status }).where(where);
  return { ok: true };
}

export async function deleteContribution(slug: string, id: string): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  const where = and(eq(schema.contributions.id, id), eq(schema.contributions.registryId, m.registry.id));
  const [row] = await db.select().from(schema.contributions).where(where).limit(1);
  if (!row) return fail("notfound");
  if (row.method === "razorpay") return fail("invalid");
  await db.delete(schema.contributions).where(where);
  return { ok: true };
}

/** The digital chandlo notebook: record an envelope handed over at the wedding. */
export async function addCashEntry(
  slug: string,
  input: { name: string; amount: number; place?: string; phone?: string; note?: string; itemId?: string | null },
): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const name = (input.name || "").trim().slice(0, 60);
  const amount = Math.round(Number(input.amount));
  if (!name || !Number.isFinite(amount) || amount < 1 || amount > 50_000_000) return fail("invalid");
  const phone = input.phone ? normalizePhone(input.phone) : null;
  if (input.phone?.trim() && !phone) return fail("invalid");
  const db = await getDb();
  let itemTitle: string | null = null;
  let itemId: string | null = null;
  if (input.itemId) {
    const [item] = await db
      .select()
      .from(schema.items)
      .where(and(eq(schema.items.id, input.itemId), eq(schema.items.registryId, m.registry.id)))
      .limit(1);
    if (item) {
      itemId = item.id;
      itemTitle = item.title;
    }
  }
  await db.insert(schema.contributions).values({
    id: newId(),
    registryId: m.registry.id,
    itemId,
    itemTitle,
    guestName: name,
    guestPhone: phone,
    guestPlace: (input.place || "").trim().slice(0, 60) || null,
    message: (input.note || "").trim().slice(0, 300) || null,
    amount,
    method: "cash",
    status: "confirmed",
  });
  return { ok: true };
}

export async function setThanked(slug: string, kind: "contribution" | "reservation", id: string, thanked: boolean): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  const thankedAt = thanked ? new Date() : null;
  if (kind === "contribution") {
    await db
      .update(schema.contributions)
      .set({ thankedAt })
      .where(and(eq(schema.contributions.id, id), eq(schema.contributions.registryId, m.registry.id)));
  } else {
    await db
      .update(schema.reservations)
      .set({ thankedAt })
      .where(and(eq(schema.reservations.id, id), eq(schema.reservations.registryId, m.registry.id)));
  }
  return { ok: true };
}

/** Couple frees up a gift (e.g. guest changed their mind and told them on a call). */
export async function releaseReservation(slug: string, id: string): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  await db
    .update(schema.reservations)
    .set({ status: "cancelled" })
    .where(and(eq(schema.reservations.id, id), eq(schema.reservations.registryId, m.registry.id)));
  return { ok: true };
}
