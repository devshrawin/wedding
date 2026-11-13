"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSession, destroySession, hashOtp, isDemoMode } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { newId, newOtp } from "@/lib/ids";
import { allow, hit } from "@/lib/rate-limit";
import { fail, type Result } from "@/lib/result";
import { normalizePhone } from "@/lib/utils";
import { resendWaitSeconds, storeOtp, verifyOtpCode } from "@/lib/otp";


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

export async function requestOtp(phoneRaw: string): Promise<Result<{ demoCode?: string; waitSeconds?: number }>> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return fail("invalid");
  if (!(await allow("otp-ip", 10, 15 * 60_000))) return fail("rate");

  const demo = isDemoMode();
  if (!demo && !process.env.MSG91_AUTH_KEY) return fail("sms");

  const db = await getDb();
  const wait = await resendWaitSeconds(db, phone);
  // Too soon: the code we just sent is still valid, so tell the caller to wait.
  if (wait > 0) return { ok: true, waitSeconds: wait };
  if (!(await hit(`otp-phone:${phone}`, 5, 60 * 60_000))) return fail("rate");

  const code = newOtp();
  await storeOtp(db, newId(), phone, hashOtp(phone, code));
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
  const outcome = await verifyOtpCode(db, phone, hashOtp(phone, code));
  if (outcome === "wrong") return fail("otp_wrong");
  if (outcome === "expired") return fail("otp_expired");
  if (outcome === "locked") return fail("rate");

  let [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({ id: newId(), phone }).onConflictDoNothing().returning();
    if (!user) [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  }
  await createSession(user.id);
  return { ok: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
