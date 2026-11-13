import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout success handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature || "");
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature || "");
}

/** Platform fee in paise for a contribution in rupees. */
export function platformFeePaise(amountRupees: number): number {
  const pct = Number(process.env.PLATFORM_FEE_PERCENT ?? "2.5");
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return Math.round(amountRupees * pct);
}

export async function createOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt, notes }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`razorpay order failed: ${res.status}`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}
