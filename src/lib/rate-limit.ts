import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter. Good for a single instance; swap the
 * Map for Redis/Upstash when running several replicas.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 20_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Returns true when the request is allowed. */
export async function allow(action: string, limit: number, windowMs: number, extraKey = ""): Promise<boolean> {
  const ip = await clientIp();
  return hit(`${action}:${ip}:${extraKey}`, limit, windowMs);
}
