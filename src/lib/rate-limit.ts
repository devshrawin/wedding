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

/**
 * The left-most X-Forwarded-For entry is whatever the client typed, so it must not
 * key a rate limit. Prefer the header our own proxy sets, else the hop it appended.
 */
export function ipFromHeaders(h: { get(name: string): string | null }): string {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",").pop()?.trim() || "local";
}

export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

/** Returns true when the request is allowed. */
export async function allow(action: string, limit: number, windowMs: number, extraKey = ""): Promise<boolean> {
  const ip = await clientIp();
  return hit(`${action}:${ip}:${extraKey}`, limit, windowMs);
}
