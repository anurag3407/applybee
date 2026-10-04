import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const rows = await db.execute(sql`
    SELECT u.id, u.email, u.status, u.created_at,
           ca_contact.available AS contact_credits, ca_ai.available AS ai_credits,
           (SELECT count(*)::int FROM drafts d WHERE d.user_id = u.id AND d.status <> 'deleted') AS draft_count
    FROM users u
    LEFT JOIN credit_accounts ca_contact ON ca_contact.user_id = u.id AND ca_contact.type = 'contact'
    LEFT JOIN credit_accounts ca_ai ON ca_ai.user_id = u.id AND ca_ai.type = 'ai'
    ORDER BY u.created_at DESC LIMIT 100
  `);
  const users = rows.rows as Array<{
    id: string; email: string; status: string; created_at: string;
    contact_credits: number | null; ai_credits: number | null; draft_count: number;
  }>;

  return (
    <AdminShell title="Users (minimal operational view)">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reveals</th>
              <th className="px-4 py-3 font-semibold">AI</th>
              <th className="px-4 py-3 font-semibold">Drafts</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-semibold text-ink">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.status === "active" ? "success" : u.status === "deleting" ? "warning" : "danger"}>{u.status}</Badge>
                </td>
                <td className="tabular px-4 py-3">{u.contact_credits ?? "—"}</td>
                <td className="tabular px-4 py-3">{u.ai_credits ?? "—"}</td>
                <td className="tabular px-4 py-3">{u.draft_count}</td>
                <td className="tabular px-4 py-3 text-text-secondary">{formatDateTime(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        No resume or draft-body access from this view. Exceptional sensitive access requires explicit permission, a
        reason, and an audit record — never default support convenience (§29.5).
      </p>
      <p className="text-xs text-text-disabled">Balances shown are materialized account values; run credits.reconcile for lot-level verification. Money totals live under Payments.</p>
    </AdminShell>
  );
}
