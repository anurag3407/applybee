import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getConnection, listDeliveries } from "@/server/services/gmail";
import { getConfig } from "@/server/config";
import { GmailConnectPanel } from "@/components/settings/gmail-connect-panel";
import { Card, Badge, StatusChip } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const user = await requireActiveUser();
  const [connection, deliveries, config] = await Promise.all([
    getConnection(user.id),
    listDeliveries(user.id, 10),
    import("@/server/config").then((m) => m.getConfig()),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-ink">Integrations</h2>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Gmail</h3>
            <p className="mt-1 max-w-xl text-sm text-text-secondary">
              “Google’s permission allows managing drafts and sending email. Apply Bee uses this connection to create
              drafts you approve. We do not send email automatically or read your inbox. You can disconnect at any time.”
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {connection ? (
                <>
                  <StatusChip status="success" label={`Connected as ${connection.googleEmail}`} />
                  <Badge tone="info">Scope: gmail.compose</Badge>
                  <Badge>Connection v{connection.version}</Badge>
                </>
              ) : (
                <StatusChip status="neutral" label="Not connected" />
              )}
            </div>
          </div>
          <GmailConnectPanel connected={Boolean(connection)} email={connection?.googleEmail ?? null} mode={config.gmailMode} />
        </div>
        <p className="mt-4 text-xs text-text-disabled">
          The Gmail grant is separate from your sign-in (dedicated OAuth project). Disconnecting invalidates pending
          approvals and blocks queued deliveries; drafts already created in your mailbox stay there.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-ink">Recent draft deliveries</h3>
        {deliveries.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No Gmail deliveries yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deliveries.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border-decorative bg-canvas px-3 py-2">
                <span className="text-sm text-ink">{formatDateTime(d.createdAt)}</span>
                <StatusChip
                  status={d.state === "created" ? "success" : d.state === "known_failed" ? "danger" : d.state === "needs_confirmation" ? "warning" : "info"}
                  label={d.state === "created" ? "Created — nothing sent" : d.state}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
