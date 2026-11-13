"use server";

import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSession, destroySession, hashOtp, isDemoMode } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { newId, newOtp } from "@/lib/ids";
import { allow, hit } from "@/lib/rate-limit";
import { fail, type Result } from "@/lib/result";
import { normalizePhone } from "@/lib/utils";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function sendSms(phone: string, code: string): Promise<boolean> {
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) return false;
  try {
    const q = new URLSearchParams({
      template_id: process.env.MSG91_TEMPLATE_ID || "",
      mobile: phone.replace("+", ""),
      otp: code,
    });
    const res = await fetch(`https://control.msg91.com/api/v5/otp?${q}`, {
      method: "POST",
      headers: { authkey: key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function requestOtp(phoneRaw: string): Promise<Result<{ demoCode?: string }>> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return fail("invalid");
  if (!(await allow("otp-ip", 10, 15 * 60_000)) || !hit(`otp-phone:${phone}`, 4, 15 * 60_000)) return fail("rate");

  const demo = isDemoMode();
  if (!demo && !process.env.MSG91_AUTH_KEY) return fail("sms");

  const code = newOtp();
  const db = await getDb();
  await db.update(schema.otpCodes).set({ consumed: true }).where(eq(schema.otpCodes.phone, phone));
  await db.insert(schema.otpCodes).values({
    id: newId(),
    phone,
    codeHash: hashOtp(phone, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  if (demo) return { ok: true, demoCode: code };
  if (!(await sendSms(phone, code))) return fail("sms");
  return { ok: true };
}

export async function verifyOtp(phoneRaw: string, codeRaw: string): Promise<Result> {
  const phone = normalizePhone(phoneRaw);
  const code = (codeRaw || "").replace(/\D/g, "");
  if (!phone || code.length !== 6) return fail("invalid");
  if (!(await allow("otp-verify", 30, 15 * 60_000))) return fail("rate");

  const db = await getDb();
  const [otp] = await db
    .select()
    .from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.phone, phone), eq(schema.otpCodes.consumed, false), gt(schema.otpCodes.expiresAt, new Date())))
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1);
  if (!otp) return fail("otp_expired");
  // Spend an attempt atomically *before* comparing, so a burst of parallel guesses
  // can't all slip through on the same counter value.
  const [spent] = await db
    .update(schema.otpCodes)
    .set({ attempts: sql`${schema.otpCodes.attempts} + 1` })
    .where(and(eq(schema.otpCodes.id, otp.id), eq(schema.otpCodes.consumed, false), lt(schema.otpCodes.attempts, MAX_ATTEMPTS)))
    .returning({ id: schema.otpCodes.id });
  if (!spent) return fail("rate");
  if (otp.codeHash !== hashOtp(phone, code)) return fail("otp_wrong");
  const [won] = await db
    .update(schema.otpCodes)
    .set({ consumed: true })
    .where(and(eq(schema.otpCodes.id, otp.id), eq(schema.otpCodes.consumed, false)))
    .returning({ id: schema.otpCodes.id });
  if (!won) return fail("otp_expired");

  let [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({ id: newId(), phone }).returning();
  }
  await createSession(user.id);
  return { ok: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
