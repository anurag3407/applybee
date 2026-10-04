import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

/**
 * Database client. Ordinary queries use Drizzle over node-postgres locally;
 * financial multi-step transitions run as audited SQL functions (§18.1) in a
 * single transaction. In production this URL points at Neon Postgres with a
 * least-privilege runtime role.
 */
const globalForDb = globalThis as unknown as { __applyBeePool?: Pool };

export const pool =
  globalForDb.__applyBeePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/applybee_dev",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__applyBeePool = pool;
}

export const db = drizzle(pool, { schema });
export type Db = typeof db;
