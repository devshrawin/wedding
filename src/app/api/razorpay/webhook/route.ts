import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay → Giftr. Source of truth for gateway payments: even if the guest
 * closes the tab before the checkout callback runs, the contribution is confirmed here.
 * Configure events: payment.captured, order.paid, payment.failed.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return new Response("webhook not configured", { status: 503 });
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "", secret)) {
    return new Response("bad signature", { status: 400 });
  }
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  if (!orderId) return Response.json({ ok: true, ignored: true });

  const db = await getDb();
  const mine = and(eq(schema.contributions.razorpayOrderId, orderId), eq(schema.contributions.method, "razorpay"));
  if (event.event === "payment.captured" || event.event === "order.paid") {
    await db.update(schema.contributions).set({ status: "confirmed", razorpayPaymentId: payment?.id ?? null }).where(mine);
  } else if (event.event === "payment.failed") {
    // Never downgrade a payment that already succeeded on a retry.
    await db.update(schema.contributions).set({ status: "initiated" }).where(and(mine, ne(schema.contributions.status, "confirmed")));
  }
  return Response.json({ ok: true });
}
