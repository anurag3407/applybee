/** GET /api/health/live — process liveness only, no secrets (§19.3). */
export async function GET() {
  return Response.json({ status: "live" }, { status: 200 });
}

export const dynamic = "force-dynamic";
