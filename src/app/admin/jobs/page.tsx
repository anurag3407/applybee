import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Jobs" };

export default async function AdminJobsPage() {
  await requireAdmin();
  const rows = await db.execute(sql`
    SELECT id, kind, state, attempts, max_attempts, error_code, left(error_message, 120) AS error_message, created_at, updated_at
    FROM jobs ORDER BY updated_at DESC LIMIT 100
  `);
  const jobs = rows.rows as Array<{
    id: string; kind: string; state: string; attempts: number; max_attempts: number;
    error_code: string | null; error_message: string | null; created_at: string; updated_at: string;
  }>;

  return (
    <AdminShell title="Jobs (sanitized)">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Kind</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Attempts</th>
              <th className="px-4 py-3 font-semibold">Error</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {jobs.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3 font-semibold text-ink">{j.kind}</td>
                <td className="px-4 py-3">
                  <Badge tone={j.state === "succeeded" ? "success" : j.state === "failed" || j.state === "needs_attention" ? "danger" : j.state === "running" ? "info" : "neutral"}>
                    {j.state}
                  </Badge>
                </td>
                <td className="tabular px-4 py-3">{j.attempts}/{j.max_attempts}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {j.error_code ? <span className="font-semibold">{j.error_code}: </span> : null}
                  {j.error_message ?? "—"}
                </td>
                <td className="tabular px-4 py-3 text-text-secondary">{formatDateTime(j.updated_at)}</td>
              </tr>
            ))}
            {jobs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-text-secondary">No jobs yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        Error messages are sanitized (no prompt content, no tokens, no email bodies). Stale-worker fencing means a
        recovered attempt cannot overwrite a newer state; Gmail external-call starts route to reconciliation, never
        automatic recreation (§20).
      </p>
    </AdminShell>
  );
}
