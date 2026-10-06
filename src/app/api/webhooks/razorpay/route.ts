import { ingestRazorpayWebhook } from "@/server/services/billing";
import { errorResponse, route } from "@/server/http";
import { getConfig } from "@/server/config";

/**
 * POST /api/webhooks/razorpay — raw-body HMAC verification, durable dedupe by
 * event id, async fulfillment (§21.3). Signature failures get 401 without
 * echoing detail.
 */
export const POST = route(async (req: Request) => {
  const config = getConfig();
  if (!config.RAZORPAY_WEBHOOK_SECRET) {
    return errorResponse(new Error("NOT_CONFIGURED"));
  }
  const raw = new Uint8Array(await req.arrayBuffer());
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const eventId = req.headers.get("x-razorpay-event-id");
  const eventType = req.headers.get("x-razorpay-event-type") ?? "unknown";

  const result = await ingestRazorpayWebhook({ rawBody: raw, signature, eventId, eventType });
  if (!result.accepted) {
    return errorResponse(new Error("WEBHOOK_REJECTED"));
  }
  return Response.json({ accepted: true }, { status: 200 });
});
