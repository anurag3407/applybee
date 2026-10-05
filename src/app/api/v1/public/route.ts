import { z } from "zod";
import { supportRequestSchema, contactDataRequestSchema, safeEmail } from "@/lib/validation";
import { db } from "@/db/client";
import { contactReports, supportTickets } from "@/db/schema";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { ok, errorResponse } from "@/server/http";
import { emailFingerprint } from "@/server/crypto";

/**
 * Public support + contact-data requests (§19.2). No account required for
 * data subjects; rate limiting is applied per source IP.
 */

/**
 * Best-effort client IP. Cloudflare Workers set CF-Connecting-IP; the
 * x-forwarded-for fallback keeps local and proxied setups working. Returns
 * "unknown" when neither header is present so the limit still applies.
 */
function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim().slice(0, 64);
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first.slice(0, 64);
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? "support";
    // Rate limit per source IP, not one global bucket. A single shared
    // principal meant three requests from anyone exhausted the budget for
    // every other visitor, so one abuser could silence the support form.
    const principal = `public:${clientIp(req)}`;
    const admission = await admitWithPreCheck({
      policy: LIMITS.publicSupport,
      principal,
      operationRef: `public:${kind}:${principal}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    });
    if (!admission.admitted) {
      const { apiError } = await import("@/server/http");
      return apiError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
    }

    const body = await req.json();
    if (kind === "newsletter") {
      const email = safeEmail.parse(body.email);
      const publicRef = `NEWS-${Date.now().toString(36).toUpperCase()}`;
      await db.insert(supportTickets).values({
        publicRef,
        email,
        category: "other",
        message: "Newsletter subscription signup",
      });
      return ok({ subscribed: true }, 201);
    }

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
