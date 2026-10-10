import { getSessionUser } from "@/server/auth/session";
import { ok, route } from "@/server/http";

/**
 * Signed-in signal for the marketing header's CTA.
 *
 * The marketing shell may not await a session — doing so made all twelve
 * public routes dynamic, which silenced `revalidate` and put every landing hit
 * on a Worker. The header asks this instead, after the page has arrived.
 *
 * Always 200, because an anonymous visitor is the normal case on a landing page
 * rather than an error: reusing `/api/v1/me` answered 401 in the console on
 * every public page view and read balances and preferences nobody asked for.
 * Signed out, this touches no database at all.
 */
export const GET = route(async () => {
  const user = await getSessionUser().catch(() => null);
  return ok({ signedIn: Boolean(user && user.status === "active") });
});
