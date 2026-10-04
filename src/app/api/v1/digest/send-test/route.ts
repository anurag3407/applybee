import { getSessionUser } from "@/server/auth/session";
import { dispatchDigestForUser } from "@/server/services/digest";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

/**
 * Test endpoint to dispatch the morning hiring digest immediately to the caller's email.
 */
export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));

    const result = await dispatchDigestForUser(user.id, { force: true });
    return ok(result);
  } catch (err) {
    return errorResponse(err);
  }
}
