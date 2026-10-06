import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ClerkScope } from "@/components/auth/clerk-scope";
import { safeInternalPath } from "@/lib/validation";
import { getConfig } from "@/server/config";

export const dynamic = "force-dynamic";

/**
 * Completes the Google OAuth round trip. The `next` search param is the
 * validated same-origin destination chosen before the redirect (see
 * GoogleAuthButton); it is re-validated here and preferred over the defaults.
 */
export default async function SSOCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (getConfig().authMode !== "clerk") redirect("/sign-in");
  const { next } = await searchParams;
  const safeNext = safeInternalPath(next);

  return (
    <ClerkScope>
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          <p className="text-sm text-text-secondary">Completing sign-in…</p>
        </div>
        <AuthenticateWithRedirectCallback
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInForceRedirectUrl={safeNext ?? "/app"}
          signUpForceRedirectUrl={safeNext ?? "/onboarding"}
          continueSignUpUrl="/sso-callback"
        />
      </div>
    </ClerkScope>
  );
}
