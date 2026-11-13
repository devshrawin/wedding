import { lt, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./db/schema";

// Any Drizzle Postgres database (PGlite in tests, postgres-js in production).
type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Fixed-window rate limiter stored in Postgres, so every app instance shares the
 * same counters. One upsert per check: the window resets in the same statement.
 */
export async function hitWith(db: AnyDb, key: string, limit: number, windowMs: number): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs);
  const t = schema.rateLimits;
  const [row] = await db
    .insert(t)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: t.key,
      set: {
        count: sql`CASE WHEN ${t.resetAt} < now() THEN 1 ELSE ${t.count} + 1 END`,
        resetAt: sql`CASE WHEN ${t.resetAt} < now() THEN ${resetAt.toISOString()}::timestamptz ELSE ${t.resetAt} END`,
      },
    })
    .returning({ count: t.count });
  // Occasional sweep keeps the table small without a cron job.
  if (Math.random() < 0.01) await db.delete(t).where(lt(t.resetAt, new Date(Date.now() - 86_400_000)));
  return (row?.count ?? 1) <= limit;
}

