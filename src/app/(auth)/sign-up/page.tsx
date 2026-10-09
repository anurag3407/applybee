import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { getSessionUser } from "@/server/auth/session";
import { getConfig } from "@/server/config";
import { safeInternalPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Create your account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ sku?: string; redirect?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect("/app");
  const { sku, redirect: target } = await searchParams;
  const skuParam = typeof sku === "string" && /^[a-z0-9_]+$/i.test(sku) ? sku : null;
  const safeTarget = safeInternalPath(target) ?? undefined;
  const destination = skuParam ? `/onboarding?sku=${skuParam}` : safeTarget;
  const { authMode } = getConfig();
  const isClerk = authMode === "clerk";
  return (
    <AuthFrame
      title="Create your account"
      subtitle="Five contact reveals and two AI generations to try. No card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-ink underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {isClerk ? (
          <GoogleAuthButton mode="sign-up" redirectTo={destination} />
        ) : (
          <>
            <div
              className="rounded-control border border-warning/30 bg-warning-wash px-3 py-2 text-xs leading-relaxed text-warning"
              role="note"
            >
              <strong>Development build:</strong> local labeled session adapter. Production uses Clerk. See{" "}
              <code>docs/adr/0001-platform.md</code>.
            </div>
            <DevSignInForm mode="sign-up" redirectTo={destination} />
          </>
        )}
      </div>
    </AuthFrame>
  );
}
