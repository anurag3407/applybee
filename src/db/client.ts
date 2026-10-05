import "server-only";
import { cache } from "react";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "@/db/schema";

/**
 * Database client.
 * In Cloudflare Workers (workerd) with Neon, connections cannot be shared across
 * requests ("Cannot perform I/O on behalf of a different request").
 * We use React's request cache so each incoming request gets its own
 * connection pool, avoiding cross-request socket reuse while reusing the
 * connection within the same request.
 *
 * Driver selection:
 * - If the connection URL contains `neon.tech`, uses `@neondatabase/serverless` (WebSocket-based).
 * - If running against a local or standard PostgreSQL server (e.g. `localhost:5432`),
 *   uses `pg.Pool` (TCP-based), preventing WebSocket protocol handshake crashes (`[cause]: ErrorEvent`).
 */
function createDb() {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://localhost:5432/applybee_dev";
  const isNeon = connectionString.includes("neon.tech");

  if (isNeon) {
    const poolInstance = new NeonPool({ connectionString });
    const instance = drizzleNeon(poolInstance, { schema });
    return {
      pool: poolInstance as unknown as PgPool,
      instance: instance as unknown as ReturnType<typeof drizzleNeon<typeof schema>>,
    };
  } else {
    const poolInstance = new PgPool({ connectionString });
    const instance = drizzlePg(poolInstance, { schema });
    return {
      pool: poolInstance,
      instance: instance as unknown as ReturnType<typeof drizzleNeon<typeof schema>>,
    };
  }
}

// Per-request cached DB for Cloudflare Workers / Next.js
const getRequestDb = cache(() => createDb());

// Global fallback for Node.js scripts / non-request environments
const globalForDb = globalThis as unknown as {
  __applyBeeDb?: ReturnType<typeof createDb>;
};
function getGlobalDb() {
  if (!globalForDb.__applyBeeDb) {
    globalForDb.__applyBeeDb = createDb();
  }
  return globalForDb.__applyBeeDb;
}

function getActiveDb() {
  try {
    return getRequestDb();
  } catch {
    return getGlobalDb();
  }
}

export const pool = new Proxy({} as PgPool, {
  get(_target, prop, receiver) {
    const { pool: p } = getActiveDb();
    const value = Reflect.get(p, prop, receiver);
    if (typeof value === "function") {
      return value.bind(p);
    }
    return value;
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzleNeon<typeof schema>>, {
  get(_target, prop, receiver) {
    const { instance } = getActiveDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export type Db = typeof db;
