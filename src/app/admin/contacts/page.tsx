import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge, Card } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Contacts" };

export default async function AdminContactsPage() {
  await requireAdmin();
  const rows = await db.execute(sql`
    SELECT c.id, c.name, c.title, c.role_category, c.status, c.verification_status,
           c.last_email_checked_at, co.name AS company_name, co.domain,
           (SELECT count(*)::int FROM contact_unlocks u WHERE u.contact_id = c.id) AS unlock_count
    FROM contacts c JOIN companies co ON co.id = c.company_id
    ORDER BY c.updated_at DESC LIMIT 100
  `);
  const contacts = rows.rows as Array<{
    id: string; name: string; title: string; role_category: string; status: string;
    verification_status: string; last_email_checked_at: string; company_name: string; domain: string; unlock_count: number;
  }>;

  return (
    <AdminShell title="Directory inventory">
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-decorative text-sm font-semibold text-text-secondary">
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Verification</th>
              <th className="px-4 py-3 font-semibold">Email checked</th>
              <th className="px-4 py-3 font-semibold">Unlocks</th>
              <th className="px-4 py-3 font-semibold">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-decorative/70">
            {contacts.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-text-secondary">{c.title}</p>
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.company_name}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.status === "active" ? "success" : c.status === "stale" ? "warning" : "danger"}>{c.status}</Badge>
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.verification_status}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(c.last_email_checked_at)}</td>
                <td className="tabular px-4 py-3 text-text-secondary">{c.unlock_count}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/contacts/${c.id}`} className="text-sm font-semibold text-ink underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-secondary">
                  No contacts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-disabled">
        Provenance and license metadata are mandatory for new records (§23.3): source, rights basis, and collection
        date must exist before a contact is listable. Fictional seed data uses reserved example domains.
      </p>
    </AdminShell>
  );
}
