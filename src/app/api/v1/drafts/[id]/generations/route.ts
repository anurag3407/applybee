import { requireApiUser } from "@/server/auth/session";
import { startGeneration } from "@/server/services/generations";
import { generationInputSchema } from "@/lib/validation";
import { accepted, assertSameOrigin, requireIdempotencyKey, route } from "@/server/http";

/**
 * POST /drafts/:id/generations — idempotent preflight/reserve/snapshot/job.
 * Returns 202 with the operation id; the client polls GET /generations/:id.
 */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
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
});
