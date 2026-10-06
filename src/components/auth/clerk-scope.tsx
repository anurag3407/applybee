import { ClerkProvider } from "@clerk/nextjs";

/**
 * Clerk client context, scoped to the routes that render a Clerk client
 * component or hook (`useClerk` in GoogleAuthButton, the SSO callback).
 * Server auth (`auth()` in the session service) reads the request state that
 * `clerkMiddleware` decorates in src/proxy.ts and never needs this provider,
 * so public pages skip it — and with it the clerk-js script and Clerk's client
 * chunks (~180 kB + ~300 kB external) on every marketing page.
 */
export function ClerkScope({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return <>{children}</>;
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
