import { getApiUser } from "@/server/auth/session";
import { getGenerationStatus, cancelGeneration } from "@/server/services/generations";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const gen = await getGenerationStatus(user.id, id);
    if (!gen) return errorResponse(new Error("GENERATION_NOT_FOUND"));
    // Real generation state only — no invented step progress (§20.5).
    return ok(gen);
  } catch (err) {
    return errorResponse(err);
  }
}

/** State-aware cancel; no blind ledger release (§19.2). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "cancel") {
      const result = await cancelGeneration(user.id, id);
      return ok(result);
    }
    return errorResponse(new Error("UNSUPPORTED_ACTION"));
  } catch (err) {
    return errorResponse(err);
  }
}
