"use server";

import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { checkAccess, ensureGuestKey, getGuestKey, grantAccess, verifyPassword } from "@/lib/auth";
import { getRegistryBySlug, razorpayEnabled } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/ids";
import { createOrder, platformFeePaise, verifyPaymentSignature } from "@/lib/razorpay";
import { allow } from "@/lib/rate-limit";
import { fail, type Result } from "@/lib/result";
import { normalizePhone } from "@/lib/utils";

async function openRegistry(slug: string) {
  const registry = await getRegistryBySlug(slug);
  if (!registry) return null;
  const access = await checkAccess(registry);
  return access.allowed ? registry : null;
}

export async function unlockRegistry(slug: string, password: string): Promise<Result> {
  if (!(await allow("unlock", 10, 10 * 60_000, slug))) return fail("rate");
  const registry = await getRegistryBySlug(slug);
  if (!registry || registry.visibility !== "password") return fail("notfound");
  if (!verifyPassword((password || "").trim(), registry.passwordHash)) return fail("password");
  await grantAccess(registry.id, "password");
  return { ok: true };
}

const guestFields = {
  name: z.string().trim().max(60).optional().transform((v) => v || null),
  phone: z.string().trim().max(20).optional().transform((v) => v || null),
  message: z.string().trim().max(300).optional().transform((v) => v || null),
  anonymous: z.boolean().default(false),
};

function guestIdentity(d: { name: string | null; phone: string | null; anonymous: boolean }) {
  if (d.anonymous) return { ok: true as const, name: null, phone: null };
  if (!d.name) return { ok: false as const };
  const phone = d.phone ? normalizePhone(d.phone) : null;
  if (d.phone && !phone) return { ok: false as const };
  return { ok: true as const, name: d.name, phone };
}

// ── Reserve a gift ────────────────────────────────────────────────────

const reserveSchema = z.object({ itemId: z.string().max(40), quantity: z.number().int().min(1).max(50).default(1), ...guestFields });

export async function reserveItem(slug: string, input: z.input<typeof reserveSchema>): Promise<Result<{ id: string }>> {
  if (!(await allow("reserve", 20, 10 * 60_000))) return fail("rate");
  const registry = await openRegistry(slug);
  if (!registry) return fail("locked");
  const parsed = reserveSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const d = parsed.data;
  const who = guestIdentity(d);
  if (!who.ok) return fail("invalid");
  const guestKey = await ensureGuestKey();
  const db = await getDb();
  const id = newId();

  const ok = await db.transaction(async (tx) => {
    // Row lock so two guests tapping "Reserve" at the same moment can't both win.
    const [item] = await tx
      .select()
      .from(schema.items)
      .where(and(eq(schema.items.id, d.itemId), eq(schema.items.registryId, registry.id)))
      .for("update")
      .limit(1);
    if (!item || item.kind !== "product" || item.hidden) return false;
    const taken = await tx
      .select({ q: schema.reservations.quantity })
      .from(schema.reservations)
      .where(and(eq(schema.reservations.itemId, item.id), ne(schema.reservations.status, "cancelled")));
    const reserved = taken.reduce((s, r) => s + r.q, 0);
    if (reserved + d.quantity > item.quantity) return false;
    const chipIns = await tx
      .select({ id: schema.contributions.id, status: schema.contributions.status })
      .from(schema.contributions)
      .where(eq(schema.contributions.itemId, item.id));
    if (chipIns.some((c) => c.status === "pending" || c.status === "confirmed")) return false;
    await tx.insert(schema.reservations).values({
      id,
      registryId: registry.id,
      itemId: item.id,
      guestKey,
      guestName: who.name,
      guestPhone: who.phone,
      message: d.message,
      anonymous: d.anonymous,
      quantity: d.quantity,
    });
    return true;
  });
  return ok ? { ok: true, id } : fail("unavailable");
}

export async function updateMyReservation(reservationId: string, action: "cancel" | "purchased"): Promise<Result> {
  const guestKey = await getGuestKey();
  if (!guestKey) return fail("auth");
  const db = await getDb();
  await db
    .update(schema.reservations)
    .set({ status: action === "cancel" ? "cancelled" : "purchased" })
    .where(and(eq(schema.reservations.id, reservationId), eq(schema.reservations.guestKey, guestKey), ne(schema.reservations.status, "cancelled")));
  return { ok: true };
}

// ── Shagun / contributions ────────────────────────────────────────────

const contributeSchema = z.object({
  itemId: z.string().max(40),
  amount: z.number().int().min(1).max(1_000_000),
  method: z.enum(["upi", "cash"]),
  utr: z.string().trim().max(30).regex(/^[A-Za-z0-9]*$/).optional().transform((v) => v || null),
  ...guestFields,
});

async function contributableItem(registryId: string, itemId: string) {
  const db = await getDb();
  const [item] = await db
    .select()
    .from(schema.items)
    .where(and(eq(schema.items.id, itemId), eq(schema.items.registryId, registryId)))
    .limit(1);
  if (!item || item.hidden) return null;
  if (item.kind === "fund") return item;
  if (!item.allowChipIn) return null;
  const res = await db
    .select({ id: schema.reservations.id })
    .from(schema.reservations)
    .where(and(eq(schema.reservations.itemId, item.id), ne(schema.reservations.status, "cancelled")));
  return res.length ? null : item;
}

export async function contribute(slug: string, input: z.input<typeof contributeSchema>): Promise<Result<{ id: string }>> {
  if (!(await allow("contribute", 15, 10 * 60_000))) return fail("rate");
  const registry = await openRegistry(slug);
  if (!registry) return fail("locked");
  const parsed = contributeSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const d = parsed.data;
  const who = guestIdentity(d);
  if (!who.ok) return fail("invalid");
  if (d.method === "upi" && !registry.upiId) return fail("payments_off");
  const item = await contributableItem(registry.id, d.itemId);
  if (!item) return fail("unavailable");
  const guestKey = await ensureGuestKey();
  const db = await getDb();
  const id = newId();
  await db.insert(schema.contributions).values({
    id,
    registryId: registry.id,
    itemId: item.id,
    itemTitle: item.title,
    guestKey,
    guestName: who.name,
    guestPhone: who.phone,
    message: d.message,
    anonymous: d.anonymous,
    amount: d.amount,
    method: d.method,
    status: "pending", // the couple confirms once they see it in their bank / in hand
    utr: d.utr,
  });
  return { ok: true, id };
}

// ── Razorpay (optional gateway) ───────────────────────────────────────

const orderSchema = contributeSchema.omit({ method: true, utr: true });

export async function startRazorpay(
  slug: string,
  input: z.input<typeof orderSchema>,
): Promise<Result<{ orderId: string; keyId: string; amountPaise: number }>> {
  if (!razorpayEnabled()) return fail("payments_off");
  if (!(await allow("razorpay", 15, 10 * 60_000))) return fail("rate");
  const registry = await openRegistry(slug);
  if (!registry) return fail("locked");
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const d = parsed.data;
  const who = guestIdentity(d);
  if (!who.ok) return fail("invalid");
  const item = await contributableItem(registry.id, d.itemId);
  if (!item) return fail("unavailable");
  const guestKey = await ensureGuestKey();
  const id = newId();
  try {
    const order = await createOrder(d.amount, id, { registry: registry.slug, item: item.id });
    const db = await getDb();
    await db.insert(schema.contributions).values({
      id,
      registryId: registry.id,
      itemId: item.id,
      itemTitle: item.title,
      guestKey,
      guestName: who.name,
      guestPhone: who.phone,
      message: d.message,
      anonymous: d.anonymous,
      amount: d.amount,
      fee: platformFeePaise(d.amount),
      method: "razorpay",
      status: "initiated",
      razorpayOrderId: order.id,
    });
    return { ok: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID!, amountPaise: order.amount };
  } catch (e) {
    console.error("[razorpay] order", e);
    return fail("server");
  }
}

export async function confirmRazorpay(input: { orderId: string; paymentId: string; signature: string }): Promise<Result> {
  if (!razorpayEnabled()) return fail("payments_off");
  if (!verifyPaymentSignature(input.orderId, input.paymentId, input.signature, process.env.RAZORPAY_KEY_SECRET!)) return fail("invalid");
  const db = await getDb();
  await db
    .update(schema.contributions)
    .set({ status: "confirmed", razorpayPaymentId: input.paymentId })
    .where(and(eq(schema.contributions.razorpayOrderId, input.orderId), eq(schema.contributions.method, "razorpay")));
  return { ok: true };
}
