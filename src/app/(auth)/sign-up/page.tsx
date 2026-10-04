import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
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
      <div className="space-y-4">
        <GoogleAuthButton mode="sign-up" />
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-decorative" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-canvas px-2 text-text-muted">or continue with email</span>
          </div>
        </div>
        <DevSignInForm mode="sign-up" redirectTo={skuParam ? `/onboarding?sku=${skuParam}` : target} />
      </div>
    </AuthFrame>
  );
}
