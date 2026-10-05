import { getApiUser } from "@/server/auth/session";
import { getDraftForUser, autosaveDraft, deleteDraft, DraftConflictError } from "@/server/services/drafts";
import { draftPatchSchema } from "@/lib/validation";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const data = await getDraftForUser(user.id, id);
    if (!data) return errorResponse(new Error("DRAFT_NOT_FOUND"));
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
  } catch (err) {
    return errorResponse(err);
  }
}

/** Version-checked autosave (§13.6). Two tabs produce an explicit conflict. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
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
  } catch (err) {
    if (err instanceof DraftConflictError) return errorResponse(new Error("VERSION_CONFLICT"));
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    await deleteDraft(user.id, id);
    return ok({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
