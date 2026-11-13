import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, or } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { Registry, User } from "./db/schema";
import { newId } from "./ids";

const SESSION_COOKIE = "giftr_session";
const GUEST_COOKIE = "giftr_guest";
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (16+ characters) in production");
    }
    return new TextEncoder().encode("giftr-dev-only-secret-not-for-production");
  }
  return new TextEncoder().encode(s);
}

const secure = () => process.env.NODE_ENV === "production" && !process.env.INSECURE_COOKIES;

export function isDemoMode(): boolean {
  if (process.env.MSG91_AUTH_KEY) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.DEMO_MODE === "true";
}

export function hashOtp(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${Buffer.from(secret()).toString("hex")}`).digest("hex");
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(pw, salt, 32).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pw, Buffer.from(saltHex, "hex"), 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ── Sessions ──────────────────────────────────────────────────────────

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const db = await getDb();
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(next = "/dashboard"): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// ── Registry authorisation ────────────────────────────────────────────

export type Role = "owner" | "family";

export async function getManagedRegistry(slug: string, user: User): Promise<{ registry: Registry; role: Role } | null> {
  const db = await getDb();
  const [registry] = await db.select().from(schema.registries).where(eq(schema.registries.slug, slug)).limit(1);
  if (!registry) return null;
  if (registry.ownerId === user.id) return { registry, role: "owner" };
  const [member] = await db
    .select()
    .from(schema.registryMembers)
    .where(and(eq(schema.registryMembers.registryId, registry.id), eq(schema.registryMembers.phone, user.phone)))
    .limit(1);
  return member ? { registry, role: "family" } : null;
}

export async function listManagedRegistries(user: User): Promise<(Registry & { role: Role })[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ registry: schema.registries })
    .from(schema.registries)
    .leftJoin(schema.registryMembers, eq(schema.registryMembers.registryId, schema.registries.id))
    .where(or(eq(schema.registries.ownerId, user.id), eq(schema.registryMembers.phone, user.phone)));
  return rows
    .map((r) => ({ ...r.registry, role: (r.registry.ownerId === user.id ? "owner" : "family") as Role }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── Guest access (password / invite) ──────────────────────────────────

const accessCookie = (registryId: string) => `giftr_access_${registryId}`;

export async function grantAccess(registryId: string, via: "password" | "invite", inviteId?: string) {
  const token = await new SignJWT({ rid: registryId, via, inv: inviteId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret());
  (await cookies()).set(accessCookie(registryId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: "/",
    maxAge: 90 * 86400,
  });
}

export type Access = { allowed: boolean; via: "open" | "password" | "invite" | "manager" | null; inviteName?: string };

export async function checkAccess(registry: Registry): Promise<Access> {
  if (registry.visibility === "link") return { allowed: true, via: "open" };
  const token = (await cookies()).get(accessCookie(registry.id))?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      const issuedAt = (payload.iat ?? 0) * 1000;
      if (payload.rid === registry.id) {
        const db = await getDb();
        if (payload.via === "invite" && payload.inv) {
          // Invite must still exist — deleting it revokes access.
          const [inv] = await db.select().from(schema.invites).where(eq(schema.invites.id, String(payload.inv))).limit(1);
          if (inv && inv.registryId === registry.id) return { allowed: true, via: "invite", inviteName: inv.guestName };
        } else if (payload.via === "password" && registry.visibility === "password") {
          // Changing the password stamps a new hash; old grants stop working.
          if (registry.passwordHash && issuedAt >= passwordSetAt(registry.passwordHash)) {
            return { allowed: true, via: "password" };
          }
        }
      }
    } catch {
      /* fallthrough */
    }
  }
  const user = await getUser();
  if (user && (await getManagedRegistry(registry.slug, user))) return { allowed: true, via: "manager" };
  return { allowed: false, via: null };
}

/** Password hashes carry a trailing `:timestamp` so old access grants can be invalidated. */
export function stampPasswordHash(hash: string): string {
  return `${hash}:${Math.floor(Date.now() / 1000) * 1000}`;
}
function passwordSetAt(stored: string): number {
  return Number(stored.split(":")[2] ?? 0);
}

// ── Anonymous guest identity (lets a guest manage their own reservation) ──

export async function getGuestKey(): Promise<string | null> {
  return (await cookies()).get(GUEST_COOKIE)?.value ?? null;
}

export async function ensureGuestKey(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing && /^[a-z0-9]{20,40}$/.test(existing)) return existing;
  const key = newId(28);
  jar.set(GUEST_COOKIE, key, { httpOnly: true, sameSite: "lax", secure: secure(), path: "/", maxAge: 365 * 86400 });
  return key;
}
