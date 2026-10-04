import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        <p className="text-sm text-text-secondary">Completing sign-in…</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInForceRedirectUrl="/app"
        signUpForceRedirectUrl="/app"
        continueSignUpUrl="/sso-callback"
      />
    </div>
  );
}
