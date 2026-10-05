import { getApiUser } from "@/server/auth/session";
import { startGeneration, GenerationPreflightError } from "@/server/services/generations";
import { generationInputSchema } from "@/lib/validation";
import { accepted, errorResponse, assertSameOrigin, requireIdempotencyKey } from "@/server/http";

/**
 * POST /drafts/:id/generations — idempotent preflight/reserve/snapshot/job.
 * Returns 202 with the operation id; the client polls GET /generations/:id.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const idempotencyKey = requireIdempotencyKey(req);
    const { id } = await params;
    const body = generationInputSchema.parse(await req.json());

    const result = await startGeneration({
      userId: user.id,
      draftId: id,
      input: {
        intent: body.intent,
        targetRole: body.targetRole,
        jobDescription: body.jobDescription,
        tone: body.tone,
        length: body.length.target,
        priorOutreachContext: body.priorOutreachContext,
      },
      idempotencyKey,
    });
    return accepted({ generationId: result.generationId, status: result.state, statusUrl: `/api/v1/generations/${result.generationId}` });
  } catch (err) {
    if (err instanceof GenerationPreflightError) {
      const statusMap: Record<string, number> = {
        INSUFFICIENT_AI_CREDITS: 409,
        NO_CONFIRMED_FACTS: 422,
        NO_RECIPIENT: 422,
        RATE_LIMITED: 429,
        DAILY_LIMIT_REACHED: 429,
        AI_DISABLED: 503,
        IDEMPOTENCY_CONFLICT: 409,
      };
      const { apiError } = await import("@/server/http");
      return apiError(statusMap[err.code] ?? 500, err.code, err.message, {
        retryAfter: err.retryAfter,
      });
    }
    return errorResponse(err);
  }
}
