import { requireApiUser } from "@/server/auth/session";
import { getDeliveryStatus, requestReconcile, recreateDelivery } from "@/server/services/gmail";
import { ok, errorResponse, assertSameOrigin, route } from "@/server/http";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const delivery = await getDeliveryStatus(user.id, id);
  if (!delivery) return errorResponse(new Error("DELIVERY_NOT_FOUND"));
  return ok({
    id: delivery.id,
    state: delivery.state,
    providerDraftId: delivery.providerDraftId,
    failureCode: delivery.failureCode,
    failureMessage: delivery.failureMessage,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  });
});

/** Bounded reconciliation request / explicit duplicate-warned recreate. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; draftId?: string };
  if (body.action === "reconcile") {
    const result = await requestReconcile(user.id, id);
    return ok(result);
  }
  if (body.action === "recreate" && body.draftId) {
    const result = await recreateDelivery(user.id, body.draftId);
    return ok(result, 202);
  }
  return errorResponse(new Error("UNSUPPORTED_ACTION"));
});
