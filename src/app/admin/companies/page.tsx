import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/primitives";

export default async function AdminCompaniesPage() {
  const rows = await db.execute(sql`
    SELECT co.id, co.name, co.domain, co.stage, co.location,
           (SELECT count(*)::int FROM company_evidence e WHERE e.company_id = co.id) AS evidence_count,
           (SELECT count(*)::int FROM contacts c WHERE c.company_id = co.id) AS contact_count
    FROM companies co ORDER BY co.name
  `);
  return (
    <AdminShell title="Companies">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Domain</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Evidence</th>
              <th className="px-4 py-3 font-semibold">Contacts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {(rows.rows as Array<{ id: string; name: string; domain: string; stage: string | null; location: string | null; evidence_count: number; contact_count: number }>).map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                <td className="tabular px-4 py-3 text-text-secondary">{c.domain}</td>
                <td className="px-4 py-3 text-text-secondary">{c.stage ?? "—"}</td>
                <td className="tabular px-4 py-3">{c.evidence_count}</td>
                <td className="tabular px-4 py-3">{c.contact_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        Company facts carry versioned sources and freshness dates; imports require the dry-run-first pipeline with
        per-row validation (§11.7). Import UI ships with the production licensed-data pipeline.
      </p>
    </AdminShell>
  );
}
