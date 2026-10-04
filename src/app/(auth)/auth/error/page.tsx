import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/primitives";

/** Safe failure surface: no tokens in URL content, no account-existence hints. */
export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const message =
    reason === "disabled"
      ? "This account is not available. Contact support if you believe this is a mistake."
      : "Sign-in couldn’t be completed. Your session may have expired.";
  return (
    <AuthFrame title="Sign-in problem" subtitle={message}>
      <div className="space-y-3">
        <Link href="/sign-in">
          <Button className="w-full">Try signing in again</Button>
        </Link>
        <Link href="/contact" className="block text-center text-sm font-semibold text-ink underline">
          Contact support
        </Link>
      </div>
    </AuthFrame>
  );
}
