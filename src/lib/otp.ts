import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./db/schema";

type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export const OTP_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
/** How many recent codes stay valid at once. */
const LIVE_CODES = 3;

const live = (phone: string) =>
  and(eq(schema.otpCodes.phone, phone), eq(schema.otpCodes.consumed, false), gt(schema.otpCodes.expiresAt, new Date()));

/**
 * Seconds until this phone may be sent another code (0 = now).
 * Resending never cancels earlier codes: a stranger who keeps hitting "send" for
 * your number can't invalidate the code already sitting in your SMS inbox.
 */
export async function resendWaitSeconds(db: AnyDb, phone: string, cooldownMs = 30_000): Promise<number> {
  const [last] = await db
    .select({ createdAt: schema.otpCodes.createdAt })
    .from(schema.otpCodes)
    .where(live(phone))
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1);
  if (!last) return 0;
  return Math.max(0, Math.ceil((last.createdAt.getTime() + cooldownMs - Date.now()) / 1000));
}

export async function storeOtp(db: AnyDb, id: string, phone: string, codeHash: string) {
  await db.insert(schema.otpCodes).values({ id, phone, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) });
}

export type VerifyOutcome = "ok" | "wrong" | "expired" | "locked";

/**
 * Checks a code against the phone's recent live codes. One attempt is spent
 * atomically before comparing, so parallel guesses can't share a counter value;
 * the attempt budget is per phone (summed over live codes), not per code.
 */
export async function verifyOtpCode(db: AnyDb, phone: string, codeHash: string): Promise<VerifyOutcome> {
  const codes = await db
    .select()
    .from(schema.otpCodes)
    .where(live(phone))
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(LIVE_CODES);
  if (!codes.length) return "expired";
  if (codes.reduce((s, c) => s + c.attempts, 0) >= MAX_ATTEMPTS) return "locked";

  const newest = codes[0];
  const [spent] = await db
    .update(schema.otpCodes)
    .set({ attempts: sql`${schema.otpCodes.attempts} + 1` })
    .where(and(eq(schema.otpCodes.id, newest.id), eq(schema.otpCodes.consumed, false), lt(schema.otpCodes.attempts, MAX_ATTEMPTS)))
    .returning({ id: schema.otpCodes.id });
  if (!spent) return "locked";

  const match = codes.find((c) => c.codeHash === codeHash);
  if (!match) return "wrong";
  const [won] = await db
    .update(schema.otpCodes)
    .set({ consumed: true })
    .where(and(eq(schema.otpCodes.id, match.id), eq(schema.otpCodes.consumed, false)))
    .returning({ id: schema.otpCodes.id });
  if (!won) return "expired";
  // Signing in retires every other outstanding code for this number.
  await db.update(schema.otpCodes).set({ consumed: true }).where(eq(schema.otpCodes.phone, phone));
  return "ok";
}
