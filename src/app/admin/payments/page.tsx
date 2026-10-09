import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTime, formatINRPaise } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Payments" };

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const rows = await db.execute(sql`
    SELECT p.id, p.provider_payment_id, p.state, p.provider_amount, p.currency, p.created_at,
           u.email, o.receipt,
           (SELECT count(*)::int FROM payment_grants g WHERE g.payment_id = p.id) AS grant_count
    FROM payments p
    JOIN users u ON u.id = p.user_id
    JOIN payment_orders o ON o.id = p.order_id
    ORDER BY p.created_at DESC LIMIT 100
  `);
  const payments = rows.rows as Array<{
    id: string; provider_payment_id: string; state: string; provider_amount: number | null;
    currency: string; created_at: string; email: string; receipt: string; grant_count: number;
  }>;

  const webhookRows = await db.execute(sql`
    SELECT provider, event_type, process_state, received_at FROM webhook_events ORDER BY received_at DESC LIMIT 20
  `);

  return (
    <AdminShell title="Payments & reconciliation">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-sm font-semibold text-text-secondary">
              <th className="px-4 py-3 font-semibold">Provider payment</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Grants</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="tabular px-4 py-3 font-semibold text-ink">{p.provider_payment_id}</td>
                <td className="px-4 py-3 text-text-secondary">{p.email}</td>
                <td className="tabular px-4 py-3">{p.provider_amount ? formatINRPaise(p.provider_amount) : "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.state === "fulfilled" ? "success" : p.state === "disputed" ? "danger" : "warning"}>{p.state}</Badge>
                </td>
                <td className="tabular px-4 py-3">
                  {p.grant_count === 1 ? "1 ✓" : p.grant_count === 0 ? "0 ⚠" : `${p.grant_count} ⚠⚠`}
                </td>
                <td className="tabular px-4 py-3 text-text-secondary">{formatDateTime(p.created_at)}</td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-text-secondary">No payments yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <Card className="mt-5">
        <h3 className="font-bold text-ink">Recent webhook events</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
          {(webhookRows.rows as Array<{ provider: string; event_type: string; process_state: string; received_at: string }>).map((e, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{e.provider} · {e.event_type}</span>
              <span className="flex items-center gap-2">
                <Badge tone={e.process_state === "processed" ? "success" : e.process_state === "quarantined" ? "danger" : "warning"}>{e.process_state}</Badge>
                <span className="tabular text-xs text-text-disabled">{formatDateTime(e.received_at)}</span>
              </span>
            </li>
          ))}
          {webhookRows.rows.length === 0 ? <li>No webhook events received.</li> : null}
        </ul>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        Grant counts other than exactly 1 indicate a defect: investigate before any manual remediation, and never edit
        balance columns directly without ledger compensation (§29.5).
      </p>
    </AdminShell>
  );
}
