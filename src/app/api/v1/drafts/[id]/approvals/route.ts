import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { approveDraftDelivery, startDelivery } from "@/server/services/gmail";
import { ok, assertSameOrigin, route } from "@/server/http";

const schema = z.object({ attachmentResumeId: z.string().uuid().nullable().optional() });

/**
 * POST /drafts/:id/approvals — approve the exact revision/mailbox/attachment
 * hash. Nothing is created until the delivery call follows (§13.5).
 */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = schema.parse(await req.json().catch(() => ({})));
  const result = await approveDraftDelivery({ userId: user.id, draftId: id, attachmentResumeId: body.attachmentResumeId ?? null });
  return ok(result);
});

/** POST /drafts/:id/gmail-deliveries equivalent: delivery from a valid approval. */
export const PUT = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = z.object({ approvalId: z.string().uuid() }).parse(await req.json());
  const result = await startDelivery({ userId: user.id, draftId: id, approvalId: body.approvalId });
  return ok(result, 202);
});
