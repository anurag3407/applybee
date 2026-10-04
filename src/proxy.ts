import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { getConfig } from "@/server/config";

/**
 * Middleware/proxy redirects are UX convenience only (§11.1) — every page and
 * API service still authorizes server-side.
 *
 * - `clerk` mode: `clerkMiddleware()` must run on every matched request.
 *   Clerk's `auth()` / `currentUser()` helpers read the request state that
 *   middleware decorates; without it they throw ("clerkMiddleware() was not
 *   run") and no Clerk session can ever resolve. The handler also sends guests
 *   to the branded sign-in page using the real auth state, never cookie
 *   presence alone.
 * - `dev` mode: the local `ab_session` cookie is the session signal, so it
 *   gates the workspace and preserves the requested path as a return target.
 *
 * Auth pages deliberately do not redirect here: the page checks the validated
 * session server-side. Redirecting on cookie presence alone bounced stale or
 * revoked sessions between `/app` and `/sign-in` forever.
 */
const PROTECTED_PREFIXES = ["/app", "/onboarding", "/admin"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function signInRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = "/sign-in";
  url.search = `?redirect=${encodeURIComponent(returnTo)}`;
  return NextResponse.redirect(url);
}

function devProxy(req: NextRequest): NextResponse {
  const hasSession = Boolean(req.cookies.get("ab_session")?.value);
  if (!hasSession && isProtectedPath(req.nextUrl.pathname)) {
    return signInRedirect(req);
  }
  return NextResponse.next();
}

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (!isProtectedPath(req.nextUrl.pathname)) return;
  const { userId } = await auth();
  if (!userId) return signInRedirect(req);
  return NextResponse.next();
});

const appConfig = getConfig();

export default appConfig.authMode === "clerk" ? clerkProxy : devProxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static assets; run on pages and API routes so
    // server-side auth helpers see the decorated request on every route.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
