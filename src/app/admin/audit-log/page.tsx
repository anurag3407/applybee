import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Audit log" };

export default async function AdminAuditPage() {
  await requireAdmin();
  const rows = await db.execute(sql`
    SELECT actor_type, actor_id, permission, action, entity_type, entity_id, reason, created_at
    FROM audit_events ORDER BY created_at DESC LIMIT 100
  `);
  const events = rows.rows as Array<{
    actor_type: string; actor_id: string | null; permission: string | null; action: string;
    entity_type: string | null; entity_id: string | null; reason: string | null; created_at: string;
  }>;

  return (
    <AdminShell title="Audit log">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-sm font-semibold text-text-secondary">
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {events.map((e, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-semibold text-ink">{e.action}{e.permission ? <span className="text-xs text-text-secondary"> ({e.permission})</span> : null}</td>
                <td className="px-4 py-3 text-text-secondary">{e.actor_type}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">{e.entity_type ? `${e.entity_type}:${(e.entity_id ?? "").slice(0, 8)}` : "—"}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">{e.reason ?? "—"}</td>
                <td className="tabular px-4 py-3 text-text-secondary">{formatDateTime(e.created_at)}</td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-text-secondary">No audit events yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        Append-only. Export policy is tamper-resistant: events are never edited or deleted, corrections are new events.
      </p>
    </AdminShell>
  );
}
