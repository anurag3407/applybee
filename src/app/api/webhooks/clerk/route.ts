import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { errorResponse, route } from "@/server/http";
import { getConfig } from "@/server/config";
import { provisionUserAndTrial } from "@/server/services/provisioning";

/**
 * POST /api/webhooks/clerk — verify official Svix-style signature/timestamp,
 * persist event, and converge provisioning with first-request provisioning.
 * Terminal tombstones prevent resurrection of deleted accounts (§17.2).
 */
export const POST = route(async (req: Request) => {
  const config = getConfig();
  const secret = config.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return errorResponse(new Error("NOT_CONFIGURED"));

  const wh = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signatureHeader = req.headers.get("svix-signature");
  if (!wh || !timestamp || !signatureHeader) return errorResponse(new Error("WEBHOOK_REJECTED"));

  // Replay window: reject timestamps older than 5 minutes.
  const ts = Number(timestamp) * 1000;
  if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) return errorResponse(new Error("WEBHOOK_REJECTED"));

  const raw = new TextDecoder().decode(new Uint8Array(await req.arrayBuffer()));
  const signedContent = `${wh}.${timestamp}.${raw}`;
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const provided = signatureHeader.split(" ").find((s) => s.startsWith("v1,") || s.startsWith("v1="))?.slice(3) ?? "";
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return errorResponse(new Error("WEBHOOK_REJECTED"));

  const event = JSON.parse(raw) as { type: string; data: { id: string; email_addresses?: Array<{ id: string; email_address: string }>; primary_email_address_id?: string; first_name?: string; last_name?: string; deleted?: boolean } };

  if (event.type === "user.created" || event.type === "user.updated") {
    const primary = event.data.email_addresses?.find((e) => e.id === event.data.primary_email_address_id) ?? event.data.email_addresses?.[0];
    if (primary) {
      const { identityFingerprint } = await import("@/server/crypto");
      await provisionUserAndTrial({
        clerkId: event.data.id,
        email: primary.email_address,
        displayName: [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") || null,
        fingerprint: identityFingerprint(primary.email_address),
      });
    }
  }
  if (event.type === "user.deleted") {
    // Terminal tombstone: mark deleting (full lifecycle runs via privacy job).
    await db.update(users).set({ status: "deleting", deletionRequestedAt: new Date(), updatedAt: new Date() }).where(eq(users.clerkId, event.data.id));
  }
  return Response.json({ accepted: true }, { status: 200 });
});
