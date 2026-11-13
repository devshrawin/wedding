import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { computeItems, computeStats } from "./compute";

export async function getRegistryBySlug(slug: string) {
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return null;
  const db = await getDb();
  const [registry] = await db.select().from(schema.registries).where(eq(schema.registries.slug, slug)).limit(1);
  return registry ?? null;
}

export async function loadRegistryData(registryId: string) {
  const db = await getDb();
  const [items, reservations, contributions] = await Promise.all([
    db.select().from(schema.items).where(eq(schema.items.registryId, registryId)),
    db.select().from(schema.reservations).where(eq(schema.reservations.registryId, registryId)),
    db.select().from(schema.contributions).where(eq(schema.contributions.registryId, registryId)),
  ]);
  // "initiated" rows are abandoned Razorpay checkouts; they never count anywhere.
  const live = contributions.filter((c) => c.status !== "initiated");
  const views = computeItems(items, reservations, live);
  return { items: views, reservations, contributions: live, stats: computeStats(views, reservations, live) };
}

export function razorpayEnabled(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
