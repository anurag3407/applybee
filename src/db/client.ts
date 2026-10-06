import "server-only";
import { cache } from "react";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "@/db/schema";

/**
 * Database client.
 *
 * Node (dev, `next start`, scripts, tests): ONE pool per process, kept on
 * `globalThis`. A pool per request was never released — measured at 3 new
 * sockets per request, 102 open after 30 requests — until PostgreSQL answered
 * a burst with `sorry, too many clients already` (SQLSTATE 53300), which the
 * API surfaced as 500/401 (requests looked signed out). A shared pool also
 * skips a fresh TCP + startup handshake on every request.
 *
 * Cloudflare Workers (workerd) is the one exception: a socket opened while
 * handling a request cannot be reused by the next ("Cannot perform I/O on
 * behalf of a different request"), so there each request still gets its own
 * pool via React's request cache.
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

/** True only inside Cloudflare's workerd — detected from its own globals. */
function isWorkersRuntime(): boolean {
  const g = globalThis as {
    navigator?: { userAgent?: string };
    WebSocketPair?: unknown;
    caches?: { default?: unknown };
  };
  return (
    g.navigator?.userAgent === "Cloudflare-Workers" ||
    typeof g.WebSocketPair !== "undefined" ||
    typeof g.caches?.default !== "undefined"
  );
}

function getActiveDb() {
  if (!isWorkersRuntime()) return getGlobalDb();
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
