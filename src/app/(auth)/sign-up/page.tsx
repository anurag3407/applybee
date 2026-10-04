import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create your account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ sku?: string; redirect?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect("/app");
  const { sku, redirect: target } = await searchParams;
  const skuParam = typeof sku === "string" && /^[a-z0-9_]+$/i.test(sku) ? sku : null;
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
      <div className="mb-4 rounded-control border border-warning/30 bg-warning-wash px-3 py-2 text-xs leading-relaxed text-warning" role="note">
        <strong>Development build:</strong> local labeled session adapter. Production uses Clerk — see{" "}
        <code>docs/adr/0002-authentication.md</code>.
      </div>
      <DevSignInForm mode="sign-up" redirectTo={skuParam ? `/onboarding?sku=${skuParam}` : target} />
      <p className="mt-4 text-xs text-text-disabled">
        Continue with Google is the production sign-in option. It is labeled “Continue”, never “Connect Gmail” — Gmail
        authorization is separate, optional, and asked for only when you choose it.
      </p>
    </AuthFrame>
  );
}
