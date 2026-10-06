import { requireApiUser } from "@/server/auth/session";
import { getDraftForUser, autosaveDraft, deleteDraft } from "@/server/services/drafts";
import { draftPatchSchema } from "@/lib/validation";
import { ok, errorResponse, assertSameOrigin, route } from "@/server/http";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const data = await getDraftForUser(user.id, id);
  if (!data) return errorResponse(new Error("DRAFT_NOT_FOUND"));
  // Soft-deleted drafts keep their rows for audit, but their content must
  // stop being served (the composer page applies the same rule).
  if (data.draft.status === "deleting" || data.draft.status === "deleted") {
    return errorResponse(new Error("DRAFT_DELETED"));
  }
  return ok({
    draft: {
      id: data.draft.id,
      mode: data.draft.mode,
      intent: data.draft.intent,
      status: data.draft.status,
      version: data.draft.currentVersion,
      updatedAt: data.draft.updatedAt,
    },
    subject: data.currentRevision?.subject ?? "",
    body: data.currentRevision?.body ?? "",
    recipient: data.recipient,
    revisionCount: data.revisionCount,
    generation: data.latestGeneration
      ? {
          id: data.latestGeneration.id,
          state: data.latestGeneration.state,
          mode: data.latestGeneration.mode,
          acceptanceState: data.latestGeneration.acceptanceState,
          proposedRevisionId: data.latestGeneration.proposedRevisionId,
          failureCode: data.latestGeneration.failureCode,
          failureMessage: data.latestGeneration.failureMessage,
        }
      : null,
    delivery: data.latestDelivery
      ? {
          id: data.latestDelivery.id,
          state: data.latestDelivery.state,
          failureCode: data.latestDelivery.failureCode,
          failureMessage: data.latestDelivery.failureMessage,
          providerDraftId: data.latestDelivery.providerDraftId,
          createdAt: data.latestDelivery.createdAt,
        }
      : null,
  });
});

/** Version-checked autosave (§13.6). Two tabs produce an explicit conflict. */
export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = draftPatchSchema.parse(await req.json());
  const result = await autosaveDraft({
    userId: user.id,
    draftId: id,
    expectedVersion: body.expectedVersion,
    subject: body.subject,
    body: body.body,
    intent: body.intent,
    mode: body.mode,
    // draftPatchSchema accepts a recipient patch; it was silently dropped
    // here, which is why a draft created from the dashboard could never be
    // given a recipient.
    recipient: body.recipient,
  });
  return ok(result);
});

export const DELETE = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  await deleteDraft(user.id, id);
  return ok({ deleted: true });
});
