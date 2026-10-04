import { sql } from "drizzle-orm";
import { db } from "@/db/client";

/** GET /api/health/ready — minimal dependency health (§19.3). */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ready", database: "ok" }, { status: 200 });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
