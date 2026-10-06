import { z } from "zod";
import { signOut, requireSessionUser } from "@/server/auth/session";
import { privacyRequests, users } from "@/db/schema";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { enqueueJob } from "@/server/services/jobs";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { ok, assertSameOrigin, apiError, route } from "@/server/http";
import { audit } from "@/server/services/audit";

const schema = z.object({ action: z.enum(["export", "delete-account"]), confirm: z.string().optional() });

/**
 * POST /privacy — export (durable job) or account deletion lifecycle.
 * Deletion requires typed confirmation and blocks new work immediately.
 */
export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireSessionUser();
  const body = schema.parse(await req.json());

  if (body.action === "export") {
    const admission = await admitWithPreCheck({ policy: LIMITS.exportData, principal: user.id, operationRef: `export:${user.id}:${Date.now()}` });
    if (!admission.admitted) {
      return apiError(429, "RATE_LIMITED", "One export per day. Please try again tomorrow.");
    }
    const inserted = (
      await db.insert(privacyRequests).values({ userId: user.id, kind: "export" }).returning({ id: privacyRequests.id })
    )[0]!;
    await enqueueJob({ kind: "privacy.export", userId: user.id, entityId: inserted.id, maxAttempts: 3 });
    await audit({ actorType: "user", actorId: user.id, action: "privacy.export_requested" });
    return ok({ requestId: inserted.id, state: "requested" }, 202);
  }

  if (body.confirm !== "DELETE") {
    return apiError(400, "CONFIRMATION_REQUIRED", 'Type DELETE to confirm account deletion.');
  }
  await admitWithPreCheck({ policy: LIMITS.deleteAccount, principal: user.id, operationRef: `delete:${user.id}:${Date.now()}` });

  // Immediate blocking: deleting status stops new jobs/purchases/deliveries.
  await db.update(users).set({ status: "deleting", deletionRequestedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  await db.insert(privacyRequests).values({ userId: user.id, kind: "delete_account", state: "requested" });
  await enqueueJob({ kind: "privacy.delete", userId: user.id, entityId: user.id, maxAttempts: 1 });
  await audit({ actorType: "user", actorId: user.id, action: "privacy.delete_requested" });
  await signOut();
  return ok({ deletionStarted: true });
});
