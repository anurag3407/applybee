import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Reports" };

export default async function AdminReportsPage() {
  const rows = await db.execute(sql`
    SELECT r.id, r.report_type, r.state, r.details, r.created_at, c.name AS contact_name
    FROM contact_reports r LEFT JOIN contacts c ON c.id = r.contact_id
    ORDER BY r.created_at DESC LIMIT 100
  `);
  const reports = rows.rows as Array<{
    id: string; report_type: string; state: string; details: string | null; created_at: string; contact_name: string | null;
  }>;

  return (
    <AdminShell title="Data & abuse reports">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Details</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-ink">{r.report_type}</td>
                <td className="px-4 py-3 text-text-secondary">{r.contact_name ?? "—"}</td>
                <td className="max-w-72 px-4 py-3 text-xs text-text-secondary">{r.details ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.state === "open" ? "warning" : r.state === "resolved" ? "success" : "neutral"}>{r.state}</Badge>
                </td>
                <td className="tabular px-4 py-3 text-text-secondary">{formatDateTime(r.created_at)}</td>
              </tr>
            ))}
            {reports.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-text-secondary">No reports.</td></tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        Removal requests without an account land here (contact-data request form). Resolution workflow: verify identity
        basis → suppress/act → record audited decision. Never delete financial evidence.
      </p>
    </AdminShell>
  );
}
