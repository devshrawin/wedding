"use server";

import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { CATEGORIES, CUSTOM_PREFIX } from "@/lib/catalog";
import { isIconKey } from "@/components/icons";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/ids";
import { fetchLinkPreview, parseSafeUrl, type LinkPreview } from "@/lib/link-preview";
import { allow } from "@/lib/rate-limit";
import { fail, type Result } from "@/lib/result";
import { getLang } from "@/lib/i18n";
import { manage, seedRows } from "@/lib/manage";
import { imageIdFromPath, saveImage } from "@/lib/images";

const MAX_ITEMS = 200;

const itemSchema = z.object({
  kind: z.enum(["product", "fund"]),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(300).optional().transform((v) => v || null),
  imageUrl: z.string().trim().max(1000).optional().transform((v) => v || null),
  icon: z.string().trim().max(30).optional().transform((v) => (isIconKey(v) ? v : null)),
  url: z.string().trim().max(2000).optional().transform((v) => v || null),
  store: z.string().trim().max(40).optional().transform((v) => v || null),
  // A built-in section, or the couple's own: "c:Wall art" (see CUSTOM_PREFIX).
  category: z
    .string()
    .trim()
    .max(42)
    .refine((v) => CATEGORIES.some((c) => c.key === v) || (v.startsWith(CUSTOM_PREFIX) && v.length > CUSTOM_PREFIX.length))
    .default("other"),
  price: z.number().int().min(1).max(50_000_000).nullable(),
  quantity: z.number().int().min(1).max(50).default(1),
  allowChipIn: z.boolean().default(false),
  hidden: z.boolean().default(false),
});
export type ItemInput = z.input<typeof itemSchema>;

function sanitize(d: z.output<typeof itemSchema>) {
  const url = d.url ? parseSafeUrl(d.url)?.toString() ?? null : null;
  let imageUrl: string | null = null;
  if (d.imageUrl && imageIdFromPath(d.imageUrl)) {
    imageUrl = d.imageUrl; // uploaded by the couple, served from /img
  } else if (d.imageUrl) {
    try {
      const u = new URL(d.imageUrl);
      if (u.protocol === "https:") imageUrl = u.toString();
    } catch {
      /* ignore bad image URL */
    }
  }
  const fund = d.kind === "fund";
  return {
    ...d,
    url: fund ? null : url,
    imageUrl: fund ? null : imageUrl,
    store: fund ? null : d.store,
    category: fund ? "fund" : d.category === "fund" ? "other" : d.category,
    quantity: fund ? 1 : d.quantity,
    allowChipIn: fund ? false : d.allowChipIn && d.price != null && d.quantity === 1,
  };
}

/** Couple picks a photo for a gift (e.g. when the store blocked our link fetch). */
export async function uploadItemImage(slug: string, dataUrl: string): Promise<Result<{ path: string }>> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  if (!(await allow("upload", 60, 10 * 60_000, m.user.id))) return fail("rate");
  const path = await saveImage(m.registry.id, "item", dataUrl);
  return path ? { ok: true, path } : fail("invalid");
}

export async function previewLink(slug: string, url: string): Promise<Result<{ preview: LinkPreview }>> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  if (!(await allow("link-preview", 30, 10 * 60_000, m.user.id))) return fail("rate");
  const preview = await fetchLinkPreview(url);
  if (!preview) return fail("invalid");
  return { ok: true, preview };
}

async function nextPosition(registryId: string): Promise<{ count: number; position: number }> {
  const db = await getDb();
  const rows = await db.select({ id: schema.items.id }).from(schema.items).where(eq(schema.items.registryId, registryId));
  const [m] = await db.select({ p: max(schema.items.position) }).from(schema.items).where(eq(schema.items.registryId, registryId));
  return { count: rows.length, position: (m?.p ?? -1) + 1 };
}

export async function addItem(slug: string, input: ItemInput): Promise<Result<{ id: string }>> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { count, position } = await nextPosition(m.registry.id);
  if (count >= MAX_ITEMS) return fail("invalid");
  const db = await getDb();
  const id = newId();
  await db.insert(schema.items).values({ id, registryId: m.registry.id, position, ...sanitize(parsed.data) });
  return { ok: true, id };
}

export async function addFromCatalog(slug: string, catalogIds: string[], fundIds: string[]): Promise<Result<{ added: number }>> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const { count, position } = await nextPosition(m.registry.id);
  const rows = seedRows(m.registry.id, catalogIds.slice(0, 60), fundIds.slice(0, 10), await getLang(), m.registry.giftWord, position);
  if (!rows.length || count + rows.length > MAX_ITEMS) return fail("invalid");
  const db = await getDb();
  await db.insert(schema.items).values(rows);
  return { ok: true, added: rows.length };
}

export async function updateItem(slug: string, itemId: string, input: ItemInput): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const db = await getDb();
  const { kind: _kind, ...patch } = sanitize(parsed.data); // an item's kind never changes
  void _kind;
  await db.update(schema.items).set(patch).where(and(eq(schema.items.id, itemId), eq(schema.items.registryId, m.registry.id)));
  return { ok: true };
}

export async function setItemHidden(slug: string, itemId: string, hidden: boolean): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  await db.update(schema.items).set({ hidden }).where(and(eq(schema.items.id, itemId), eq(schema.items.registryId, m.registry.id)));
  return { ok: true };
}

export async function deleteItem(slug: string, itemId: string): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  await db.delete(schema.items).where(and(eq(schema.items.id, itemId), eq(schema.items.registryId, m.registry.id)));
  return { ok: true };
}
