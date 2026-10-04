import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";

export default async function SessionExpiredPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect: target } = await searchParams;
  const safeTarget = target && target.startsWith("/") && !target.startsWith("//") ? target : undefined;
  return (
    <AuthFrame
      title="Session expired"
      subtitle="Sign in again to continue. Anything you saved before expiry is still there."
    >
      <DevSignInForm mode="sign-in" redirectTo={safeTarget} />
      <p className="mt-4 text-xs text-text-disabled">
        Unsaved in-editor text from your last session isn’t recovered automatically — the editor warns you before
        signing out.
      </p>
      <Link href="/" className="mt-4 block text-center text-sm font-semibold text-ink underline">
        Back to home
      </Link>
    </AuthFrame>
  );
}
