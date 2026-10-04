import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";
import { approveDraftDelivery, startDelivery, DeliveryPreflightError } from "@/server/services/gmail";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

const schema = z.object({ attachmentResumeId: z.string().uuid().nullable().optional() });

/**
 * POST /drafts/:id/approvals — approve the exact revision/mailbox/attachment
 * hash. Nothing is created until the delivery call follows (§13.5).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const body = schema.parse(await req.json().catch(() => ({})));
    const result = await approveDraftDelivery({ userId: user.id, draftId: id, attachmentResumeId: body.attachmentResumeId ?? null });
    return ok(result);
  } catch (err) {
    if (err instanceof DeliveryPreflightError) {
      const statusMap: Record<string, number> = {
        NOT_CONNECTED: 409,
        CONTACT_LOCKED: 409,
        RECIPIENT_SUPPRESSED: 422,
        GMAIL_DISABLED: 503,
      };
      const { apiError } = await import("@/server/http");
      return apiError(statusMap[err.code] ?? 500, err.code, err.message);
    }
    return errorResponse(err);
  }
}

/** POST /drafts/:id/gmail-deliveries equivalent: delivery from a valid approval. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const body = z.object({ approvalId: z.string().uuid() }).parse(await req.json());
    const result = await startDelivery({ userId: user.id, draftId: id, approvalId: body.approvalId });
    return ok(result, 202);
  } catch (err) {
    if (err instanceof DeliveryPreflightError) {
      const { apiError } = await import("@/server/http");
      return apiError(409, err.code, err.message);
    }
    return errorResponse(err);
  }
}
