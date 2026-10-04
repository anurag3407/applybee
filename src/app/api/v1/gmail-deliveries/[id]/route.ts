import { getApiUser } from "@/server/auth/session";
import { getDeliveryStatus, requestReconcile, recreateDelivery, DeliveryPreflightError } from "@/server/services/gmail";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
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
  } catch (err) {
    return errorResponse(err);
  }
}

/** Bounded reconciliation request / explicit duplicate-warned recreate. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
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
  } catch (err) {
    if (err instanceof DeliveryPreflightError) {
      const { apiError } = await import("@/server/http");
      return apiError(409, err.code, err.message);
    }
    return errorResponse(err);
  }
}
