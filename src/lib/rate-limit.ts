import "server-only";
import { headers } from "next/headers";
import { getDb } from "./db";
import { hitWith } from "./limits";

export { hitWith };

export async function hit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return hitWith(await getDb(), key, limit, windowMs);
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
