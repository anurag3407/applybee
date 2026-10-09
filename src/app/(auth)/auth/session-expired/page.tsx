import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { getConfig } from "@/server/config";
import { safeInternalPath } from "@/lib/validation";

export default async function SessionExpiredPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect: target } = await searchParams;
  const safeTarget = safeInternalPath(target) ?? undefined;
  const { authMode } = getConfig();
  return (
    <AuthFrame
      title="Session expired"
      subtitle="Sign in again to continue. Anything you saved before expiry is still there."
    >
      {authMode === "clerk" ? (
        <GoogleAuthButton mode="sign-in" redirectTo={safeTarget} />
      ) : (
        <DevSignInForm mode="sign-in" redirectTo={safeTarget} />
      )}
      <p className="mt-4 text-xs text-text-disabled">
        Unsaved in-editor text from your last session isn’t recovered automatically. The editor warns you before
        signing out.
      </p>
      <Link href="/" className="mt-4 block text-center text-sm font-semibold text-ink underline">
        Back to home
      </Link>
    </AuthFrame>
  );
}
