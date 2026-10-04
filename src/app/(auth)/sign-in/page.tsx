import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { DevSignInForm } from "@/components/auth/dev-signin-form";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

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
      <div className="mb-4 rounded-control border border-warning/30 bg-warning-wash px-3 py-2 text-xs leading-relaxed text-warning" role="note">
        <strong>Development build:</strong> this environment uses a local labeled session adapter. Production sign-in
        uses Clerk with Google sign-in — see <code>docs/adr/0002-authentication.md</code>.
      </div>
      <DevSignInForm mode="sign-in" redirectTo={target} />
    </AuthFrame>
  );
}
