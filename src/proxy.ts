import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware/proxy redirects are UX convenience only (§11.1) — every page and
 * API service still authorizes server-side.
 */
export default function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get("ab_session")?.value);
  const { pathname, search } = req.nextUrl;

  if (!hasSession && (pathname.startsWith("/app") || pathname.startsWith("/onboarding") || pathname.startsWith("/admin"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*", "/admin/:path*", "/sign-in", "/sign-up"],
};
