import { requireApiUser } from "@/server/auth/session";
import { getGenerationStatus, cancelGeneration } from "@/server/services/generations";
import { ok, errorResponse, assertSameOrigin, route } from "@/server/http";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const gen = await getGenerationStatus(user.id, id);
  if (!gen) return errorResponse(new Error("GENERATION_NOT_FOUND"));
  // Real generation state only — no invented step progress (§20.5).
  return ok(gen);
});

/** State-aware cancel; no blind ledger release (§19.2). */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "cancel") {
    const result = await cancelGeneration(user.id, id);
    return ok(result);
  }
  return errorResponse(new Error("UNSUPPORTED_ACTION"));
});
