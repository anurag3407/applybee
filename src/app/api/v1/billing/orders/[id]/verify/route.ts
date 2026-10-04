import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { verifyCheckout, OrderError } from "@/server/services/billing";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

const schema = z.object({
  razorpayOrderId: z.string().min(4).max(120),
  razorpayPaymentId: z.string().min(4).max(120),
  razorpaySignature: z.string().min(8).max(256),
});

/**
 * POST /billing/orders/:id/verify — verify checkout signature and provider
 * state; never trusts the client paid flag (§19.2, §21.2).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
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
  } catch (err) {
    if (err instanceof OrderError) {
      const { apiError } = await import("@/server/http");
      return apiError(err.code === "ORDER_NOT_FOUND" ? 404 : 400, err.code, err.message);
    }
    return errorResponse(err);
  }
}
