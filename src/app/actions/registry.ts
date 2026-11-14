"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getUser, hashPassword, stampPasswordHash } from "@/lib/auth";
import { manage, seedRows } from "@/lib/manage";
import { deleteImage, saveImage } from "@/lib/images";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/ids";
import { allow } from "@/lib/rate-limit";
import { fail, type Result } from "@/lib/result";
import { isValidUpiId, normalizePhone, slugBase, THEMES } from "@/lib/utils";
import { TRADITIONS, type Tradition } from "@/lib/traditions";

const name = z.string().trim().min(1).max(40);
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
const photo = z
  .string()
  .max(400_000)
  .regex(/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/)
  .nullish()
  .transform((v) => v || null);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullish()
  .or(z.literal(""))
  .transform((v) => v || null);
const theme = z.enum(Object.keys(THEMES) as [string, ...string[]]);

const ceremonySchema = z.object({
  tradition: z.enum(TRADITIONS.map((t) => t.key) as [Tradition, ...Tradition[]]).default("none"),
  greeting: optional(60),
  ledgerHeading: optional(80),
  giftWord: optional(24),
});

const createSchema = ceremonySchema.extend({
  partnerOne: name,
  partnerTwo: name,
  weddingDate: date,
  city: optional(60),
  note: optional(400),
  photo,
  theme: theme.default("ruby"),
  catalogIds: z.array(z.string()).max(60).default([]),
  fundIds: z.array(z.string()).max(10).default([]),
  lang: z.enum(["en", "hi"]).default("en"),
});

export async function createRegistry(input: z.input<typeof createSchema>): Promise<Result<{ slug: string }>> {
  const user = await getUser();
  if (!user) return fail("auth");
  if (!(await allow("create-registry", 8, 60 * 60_000))) return fail("rate");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const d = parsed.data;
  const db = await getDb();

  // Keep slugs short enough for getRegistryBySlug (≤ 40 chars) even with a suffix.
  const base = slugBase(d.partnerOne, d.partnerTwo);
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const [clash] = await db.select({ id: schema.registries.id }).from(schema.registries).where(eq(schema.registries.slug, slug)).limit(1);
    if (!clash) break;
    slug = `${base}-${newId(i < 4 ? 4 : 8)}`;
  }

  const id = newId();
  try {
    await db.transaction(async (tx) => {
    await tx.insert(schema.registries).values({
      id,
      slug,
      ownerId: user.id,
      partnerOne: d.partnerOne,
      partnerTwo: d.partnerTwo,
      weddingDate: d.weddingDate,
      city: d.city,
      note: d.note,
      theme: d.theme,
      tradition: d.tradition,
      greeting: d.greeting,
      ledgerHeading: d.ledgerHeading,
      giftWord: d.giftWord,
    });
    const rows = seedRows(id, d.catalogIds, d.fundIds, d.lang, d.giftWord);
      if (rows.length) await tx.insert(schema.items).values(rows);
    });
  } catch (e) {
    console.error("[createRegistry]", e); // e.g. two couples racing for the same slug
    return fail("server");
  }
  if (d.photo) {
    const path = await saveImage(id, "couple", d.photo);
    if (path) await db.update(schema.registries).set({ photo: path }).where(eq(schema.registries.id, id));
  }
  return { ok: true, slug };
}

const detailsSchema = createSchema.pick({ partnerOne: true, partnerTwo: true, weddingDate: true, city: true, note: true, theme: true }).extend({
  photo: photo.or(z.literal("keep")),
});

export async function updateDetails(slug: string, input: z.input<typeof detailsSchema>): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const parsed = detailsSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { photo: p, ...rest } = parsed.data;
  const db = await getDb();
  let photo: string | null | undefined; // undefined = unchanged
  if (p !== "keep") {
    photo = p ? await saveImage(m.registry.id, "couple", p) : null;
    if (p && !photo) return fail("invalid");
  }
  await db
    .update(schema.registries)
    .set({ ...rest, ...(photo === undefined ? {} : { photo }) })
    .where(eq(schema.registries.id, m.registry.id));
  if (photo !== undefined) await deleteImage(m.registry.id, m.registry.photo);
  return { ok: true };
}

/** Ceremony style and the couple's own words. Clearing a field hides it. */
export async function updateCeremony(slug: string, input: z.input<typeof ceremonySchema>): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const parsed = ceremonySchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const db = await getDb();
  await db.update(schema.registries).set(parsed.data).where(eq(schema.registries.id, m.registry.id));
  return { ok: true };
}

const privacySchema = z.object({
  visibility: z.enum(["link", "password", "invite"]),
  password: z.string().trim().min(4).max(40).optional().or(z.literal("")),
  hideReserved: z.boolean(),
  showAmounts: z.boolean(),
});

export async function updatePrivacy(slug: string, input: z.input<typeof privacySchema>): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const d = parsed.data;
  let passwordHash = m.registry.passwordHash;
  if (d.visibility === "password") {
    if (d.password) passwordHash = stampPasswordHash(hashPassword(d.password));
    if (!passwordHash) return fail("invalid");
  }
  const db = await getDb();
  await db
    .update(schema.registries)
    .set({ visibility: d.visibility, passwordHash, hideReserved: d.hideReserved, showAmounts: d.showAmounts })
    .where(eq(schema.registries.id, m.registry.id));
  return { ok: true };
}

export async function updateUpi(slug: string, input: { upiId: string; upiName: string }): Promise<Result> {
  const m = await manage(slug);
  // Where the money goes is the couple's call alone — family helpers can't redirect it.
  if (!m || m.role !== "owner") return fail("auth");
  const upiId = (input.upiId || "").trim().toLowerCase();
  const upiName = (input.upiName || "").trim().slice(0, 60);
  if (upiId && (!isValidUpiId(upiId) || !upiName)) return fail("invalid");
  const db = await getDb();
  await db
    .update(schema.registries)
    .set({ upiId: upiId || null, upiName: upiId ? upiName : null })
    .where(eq(schema.registries.id, m.registry.id));
  return { ok: true };
}

// ── Family mode ───────────────────────────────────────────────────────

export async function addFamilyMember(slug: string, input: { name: string; phone: string; relation?: string }): Promise<Result> {
  const m = await manage(slug);
  if (!m || m.role !== "owner") return fail("auth");
  const phone = normalizePhone(input.phone);
  const nm = (input.name || "").trim().slice(0, 40);
  if (!phone || !nm || phone === m.user.phone) return fail("invalid");
  const db = await getDb();
  const existing = await db.select().from(schema.registryMembers).where(eq(schema.registryMembers.registryId, m.registry.id));
  if (existing.length >= 10) return fail("invalid");
  if (existing.some((e) => e.phone === phone)) return { ok: true };
  await db.insert(schema.registryMembers).values({
    id: newId(),
    registryId: m.registry.id,
    phone,
    name: nm,
    relation: (input.relation || "").trim().slice(0, 30) || null,
  });
  return { ok: true };
}

export async function removeFamilyMember(slug: string, memberId: string): Promise<Result> {
  const m = await manage(slug);
  if (!m || m.role !== "owner") return fail("auth");
  const db = await getDb();
  await db
    .delete(schema.registryMembers)
    .where(and(eq(schema.registryMembers.id, memberId), eq(schema.registryMembers.registryId, m.registry.id)));
  return { ok: true };
}

// ── Invites ───────────────────────────────────────────────────────────

export async function createInvites(slug: string, names: string[]): Promise<Result<{ created: number }>> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const clean = [...new Set(names.map((n) => n.trim().slice(0, 50)).filter(Boolean))].slice(0, 50);
  if (!clean.length) return fail("invalid");
  const db = await getDb();
  const existing = await db.select({ id: schema.invites.id }).from(schema.invites).where(eq(schema.invites.registryId, m.registry.id));
  if (existing.length + clean.length > 1000) return fail("invalid");
  await db.insert(schema.invites).values(clean.map((guestName) => ({ id: newId(), registryId: m.registry.id, token: newId(20), guestName })));
  return { ok: true, created: clean.length };
}

export async function deleteInvite(slug: string, inviteId: string): Promise<Result> {
  const m = await manage(slug);
  if (!m) return fail("auth");
  const db = await getDb();
  await db.delete(schema.invites).where(and(eq(schema.invites.id, inviteId), eq(schema.invites.registryId, m.registry.id)));
  return { ok: true };
}

export async function deleteRegistry(slug: string, confirmSlug: string): Promise<Result> {
  const m = await manage(slug);
  if (!m || m.role !== "owner") return fail("auth");
  if (confirmSlug.trim() !== m.registry.slug) return fail("invalid");
  const db = await getDb();
  await db.delete(schema.registries).where(eq(schema.registries.id, m.registry.id));
  return { ok: true };
}
