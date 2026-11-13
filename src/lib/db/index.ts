import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type DB = PgliteDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __giftrDb?: Promise<DB> };

async function init(): Promise<DB> {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  const url = process.env.DATABASE_URL;

  if (url) {
    // Production: any Postgres (Supabase, Neon, RDS…)
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { prepare: false, max: 5 });
    const db = drizzle(client, { schema });
    if (process.env.DB_AUTO_MIGRATE !== "false") {
      const { migrate } = await import("drizzle-orm/postgres-js/migrator");
      await migrate(db, { migrationsFolder });
    }
    return db as unknown as DB;
  }

  // Zero-config: embedded Postgres (PGlite) persisted on disk.
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  const inMemory = dir === "memory";
  if (!inMemory) fs.mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = inMemory ? new PGlite() : new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return db;
}

export function getDb(): Promise<DB> {
  if (!globalForDb.__giftrDb) {
    globalForDb.__giftrDb = init().catch((err) => {
      globalForDb.__giftrDb = undefined;
      throw err;
    });
  }
  return globalForDb.__giftrDb;
}

export { schema };
