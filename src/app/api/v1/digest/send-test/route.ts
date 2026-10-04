import { getApiUser } from "@/server/auth/session";
import { dispatchDigestForUser } from "@/server/services/digest";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

/**
 * Dispatch the morning hiring digest immediately to the caller's own mailbox.
 * `force` bypasses the once-per-day guard, so this route is rate limited —
 * without a limit it is an authenticated mail-bomb button against Resend.
 */
export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));

    const admission = await admitWithPreCheck({
      policy: LIMITS.digestTest,
      principal: user.id,
      operationRef: `digest-test:${user.id}:${Date.now()}`,
    });
    if (!admission.admitted) {
      return errorResponse(new Error("RATE_LIMITED"));
    }

    const result = await dispatchDigestForUser(user.id, { force: true });
    return ok(result);
  } catch (err) {
    return errorResponse(err);
  }
}