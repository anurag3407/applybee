import { z } from "zod";
import { supportRequestSchema, contactDataRequestSchema } from "@/lib/validation";
import { db } from "@/db/client";
import { contactReports, supportTickets } from "@/db/schema";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { ok, errorResponse } from "@/server/http";
import { emailFingerprint } from "@/server/crypto";

/**
 * Public support + contact-data requests (§19.2). No account required for
 * data subjects; challenge/limits apply per trusted IP (simplified to global
 * principal here, documented limitation).
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? "support";
    const principal = "public";
    await admitWithPreCheck({ policy: LIMITS.publicSupport, principal, operationRef: `public:${kind}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}` });

    const body = await req.json();
    if (kind === "contact-data-request") {
      const parsed = contactDataRequestSchema.parse(body);
      await db.insert(contactReports).values({
        reportType: parsed.requestType === "removal" ? "removal" : "incorrect",
        emailFingerprint: emailFingerprint(parsed.email),
        details: parsed.details,
        proofContact: parsed.email,
      });
      const { sendContactDataRequestNotification } = await import("@/server/services/email");
      sendContactDataRequestNotification({
        email: parsed.email,
        requestType: parsed.requestType,
        details: parsed.details,
      }).catch(() => {});
      return ok({ received: true, note: "We'll review and respond to this request. No account is needed." }, 201);
    }

    const parsed = supportRequestSchema.parse(body);
    const publicRef = `SUP-${Date.now().toString(36).toUpperCase()}`;
    await db.insert(supportTickets).values({
      publicRef,
      email: parsed.email,
      category: parsed.category,
      message: parsed.message,
    });
    const { sendSupportTicketNotification } = await import("@/server/services/email");
    sendSupportTicketNotification({
      userEmail: parsed.email,
      publicRef,
      category: parsed.category,
      message: parsed.message,
    }).catch(() => {});
    return ok({ reference: publicRef }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
