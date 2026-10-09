import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { ExportDeletionPanel } from "@/components/settings/export-deletion-panel";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Privacy" };

export default async function SettingsPrivacyPage() {
  const user = await requireActiveUser();
  return (
    <div className="space-y-5">

      <Card>
        <h3 className="font-bold text-ink">Export your data</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Your profile, drafts, opportunities, and credit ledger metadata as a downloadable file. Exports run as durable
          jobs (one per day) and the archive is available for 24 hours.
        </p>
        <ExportDeletionPanel mode="export" />
      </Card>

      <Card className="border-danger/30">
        <h3 className="font-bold text-danger">Delete account</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Deleting blocks new work immediately: purchases, generation, and delivery stop. Files and derived content are
          removed; legally required financial records are retained separately, pseudonymized where lawful.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          <strong className="text-ink">What stays:</strong> drafts already created in your Gmail remain in your mailbox.
          ReachBee cannot remove external copies. Copied files on your devices remain yours.
        </p>
        <ExportDeletionPanel mode="delete" />
      </Card>

      <p className="text-xs text-text-disabled">
        {user.status === "deleting"
          ? "Your account is in the deletion process. Support can help with questions; it cannot be silently resurrected."
          : "See the privacy policy for retention details and processor list."}
      </p>
    </div>
  );
}
