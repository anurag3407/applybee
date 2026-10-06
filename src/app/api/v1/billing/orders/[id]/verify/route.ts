import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { verifyCheckout } from "@/server/services/billing";
import { ok, assertSameOrigin, route } from "@/server/http";

const schema = z.object({
  razorpayOrderId: z.string().min(4).max(120),
  razorpayPaymentId: z.string().min(4).max(120),
  razorpaySignature: z.string().min(8).max(256),
});

/**
 * POST /billing/orders/:id/verify — verify checkout signature and provider
 * state; never trusts the client paid flag (§19.2, §21.2).
 */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  const body = schema.parse(await req.json());
  const result = await verifyCheckout({
    userId: user.id,
    orderId: id,
    providerOrderId: body.razorpayOrderId,
    providerPaymentId: body.razorpayPaymentId,
    signature: body.razorpaySignature,
  });
  return ok(result);
});
