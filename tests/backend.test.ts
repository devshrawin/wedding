// Database-backed tests for OTP, rate limits and image checks, on an in-memory PGlite.
import assert from "node:assert/strict";
import path from "node:path";
import { before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/lib/db/schema";
import { hitWith } from "../src/lib/limits";
import { resendWaitSeconds, storeOtp, verifyOtpCode } from "../src/lib/otp";
import { chipInRemaining } from "../src/lib/compute";
import { ipFromHeaders } from "../src/lib/rate-limit";
import { sniffMime } from "../src/lib/images";
import { slugBase } from "../src/lib/utils";

const db = drizzle(new PGlite(), { schema });
before(async () => {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
});

test("rate limit counts per key and resets after the window", async () => {
  for (let i = 0; i < 3; i++) assert.ok(await hitWith(db, "k1", 3, 60_000));
  assert.equal(await hitWith(db, "k1", 3, 60_000), false);
  assert.ok(await hitWith(db, "k2", 3, 60_000), "other keys unaffected");
  await hitWith(db, "short", 1, 1);
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(await hitWith(db, "short", 1, 1), "window expired, counter reset");
});

test("resending an OTP keeps the earlier code valid", async () => {
  const phone = "+919800000001";
  await storeOtp(db, "o1", phone, "hashA");
  assert.ok((await resendWaitSeconds(db, phone)) > 0, "cooldown right after a send");
  await storeOtp(db, "o2", phone, "hashB"); // a stranger triggers another send
  assert.equal(await verifyOtpCode(db, phone, "hashA"), "ok", "the code already in the inbox still works");
  assert.equal(await verifyOtpCode(db, phone, "hashB"), "expired", "signing in retires the other codes");
});

test("OTP attempt budget is per phone and survives parallel guesses", async () => {
  const phone = "+919800000002";
  await storeOtp(db, "o3", phone, "right");
  const results = await Promise.all(Array.from({ length: 12 }, () => verifyOtpCode(db, phone, "wrong")));
  assert.equal(results.filter((r) => r === "wrong").length, 5, "exactly 5 guesses are evaluated");
  assert.ok(results.slice(5).every((r) => r === "locked" || r === "wrong"));
  assert.equal(await verifyOtpCode(db, phone, "right"), "locked", "even the right code is refused once locked");
});

test("chip-in cap counts pending pledges, not rejected ones", () => {
  const given = [
    { amount: 2000, status: "confirmed" },
    { amount: 1500, status: "pending" },
    { amount: 9000, status: "rejected" },
    { amount: 9000, status: "initiated" },
  ];
  assert.equal(chipInRemaining(6500, given), 3000);
  assert.equal(chipInRemaining(3000, given), 0);
});

test("rate-limit IP ignores the client-controlled first X-Forwarded-For hop", () => {
  const h = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null });
  assert.equal(ipFromHeaders(h({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" })), "203.0.113.9");
  assert.equal(ipFromHeaders(h({ "x-real-ip": "198.51.100.4", "x-forwarded-for": "1.1.1.1" })), "198.51.100.4");
  assert.equal(ipFromHeaders(h({})), "local");
});

test("uploads are identified by their bytes, not their claimed type", () => {
  assert.equal(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "image/jpeg");
  assert.equal(sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
  assert.equal(sniffMime(Buffer.from("RIFF0000WEBPVP8 ")), "image/webp");
  assert.equal(sniffMime(Buffer.from("<svg onload=alert(1)>")), null);
});

test("slugs stay short enough for lookups even with long names", () => {
  const s = slugBase("Venkatanarasimharajuvaripeta", "Bhagyalakshmiammavaru Srinivasan");
  assert.ok(s.length <= 29, s);
  assert.equal(slugBase("Priya Sharma", "Arjun"), "priya-arjun");
  assert.equal(slugBase("प्रिया", "अर्जुन"), "shaadi");
});
