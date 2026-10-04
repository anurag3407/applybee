import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect("/app");
  const { redirect: target } = await searchParams;
  return (
    <AuthFrame
      title="Sign in"
      subtitle="Welcome back. Your drafts and credits are waiting."
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="font-semibold text-ink underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleAuthButton mode="sign-in" />
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-decorative" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-canvas px-2 text-text-muted">or continue with email</span>
          </div>
        </div>
        <DevSignInForm mode="sign-in" redirectTo={target} />
      </div>
    </AuthFrame>
  );
}
