import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Security settings" };

export default async function SettingsSecurityPage() {
  const user = await requireActiveUser();
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="font-bold text-ink">Account & sessions</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Password, multi-factor authentication, and session management are handled by the authentication provider.
          In production these appear here through Clerk’s secure account component; reauthentication is required for
          sensitive actions.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Signed in as <strong className="text-ink">{user.email}</strong> via{" "}
          {user.authMode === "dev" ? "email session" : "Google / Clerk authentication"}.
        </p>
      </Card>
      <Card>
        <h3 className="font-bold text-ink">Gmail authorization</h3>
        <p className="mt-2 text-sm text-text-secondary">
          The Gmail grant lives in a dedicated OAuth project, separate from sign-in, so revoking one cannot disrupt the
          other. Manage it under{" "}
          <Link href="/app/settings/integrations" className="text-info underline">
            Integrations
          </Link>
          .
        </p>
      </Card>
      <Card>
        <h3 className="font-bold text-ink">Data requests</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Export your data or delete your account from{" "}
          <Link href="/app/settings/privacy" className="text-info underline">
            Privacy
          </Link>
          . Both require recent authentication.
        </p>
      </Card>
    </div>
  );
}
