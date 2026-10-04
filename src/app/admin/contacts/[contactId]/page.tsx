import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge, Card, Button } from "@/components/ui/primitives";
import { audit } from "@/server/services/audit";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Contact" };

export default async function AdminContactPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const rows = await db.execute(sql`
    SELECT c.id, c.name, c.title, c.status, c.verification_status, c.email_domain, co.name AS company_name
    FROM contacts c JOIN companies co ON co.id = c.company_id WHERE c.id = ${contactId}::uuid
  `);
  const contact = rows.rows[0] as
    | { id: string; name: string; title: string; status: string; verification_status: string; email_domain: string; company_name: string }
    | undefined;
  if (!contact) notFound();

  const sources = await db.execute(sql`SELECT provider, license_ref, collection_date, permitted_uses FROM contact_sources WHERE contact_id = ${contactId}::uuid`);
  const verifications = await db.execute(sql`SELECT method, result, checked_at FROM contact_verifications WHERE contact_id = ${contactId}::uuid ORDER BY checked_at DESC LIMIT 10`);

  async function suppress(formData: FormData) {
    "use server";
    const reason = String(formData.get("reason") ?? "Operator suppression");
    const scope = String(formData.get("scope") ?? "delivery_wide");
    const admin = await (await import("@/server/auth/session")).requireAdmin();
    await db.execute(sql`
      INSERT INTO contact_suppressions (email_fingerprint, contact_id, scope, reason)
      SELECT email_fingerprint, id, ${scope}, ${reason} FROM contacts WHERE id = ${contactId}::uuid
      ON CONFLICT (email_fingerprint) WHERE state = 'active' DO NOTHING
    `);
    await db.execute(sql`UPDATE contacts SET status = 'suppressed', updated_at = now() WHERE id = ${contactId}::uuid`);
    await audit({
      actorType: "admin",
      actorId: admin.id,
      permission: "contacts.manage",
      action: "contact.suppressed",
      entityType: "contact",
      entityId: contactId,
      reason,
      metadata: { scope },
    });
    revalidatePath(`/admin/contacts/${contactId}`);
  }

  async function markStale() {
    "use server";
    const admin = await (await import("@/server/auth/session")).requireAdmin();
    await db.execute(sql`UPDATE contacts SET status = 'stale', updated_at = now() WHERE id = ${contactId}::uuid`);
    await audit({ actorType: "admin", actorId: admin.id, permission: "contacts.manage", action: "contact.marked_stale", entityType: "contact", entityId: contactId });
    revalidatePath(`/admin/contacts/${contactId}`);
  }

  return (
    <AdminShell title={`Contact: ${contact.name}`}>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">
              {contact.name} · {contact.title}
            </h2>
            <p className="text-sm text-text-secondary">
              {contact.company_name} · {contact.email_domain}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone={contact.status === "active" ? "success" : "warning"}>{contact.status}</Badge>
            <Badge>{contact.verification_status}</Badge>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <form action={suppress} className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-semibold text-ink">Suppression reason</label>
              <input id="reason" name="reason" className="h-10 rounded-control border border-border-control bg-surface px-3 text-sm" defaultValue="Data subject request" required />
            </div>
            <div>
              <label htmlFor="scope" className="mb-1 block text-sm font-semibold text-ink">Scope</label>
              <select id="scope" name="scope" className="h-10 rounded-control border border-border-control bg-surface px-3 text-sm">
                <option value="delivery_wide">Delivery-wide (blocks manual copies too)</option>
                <option value="directory_only">Directory-only</option>
              </select>
            </div>
            <Button size="sm" variant="danger" type="submit">Suppress</Button>
          </form>
          <form action={markStale}>
            <Button size="sm" variant="secondary" type="submit">Mark stale</Button>
          </form>
        </div>
      </Card>

      <Card className="mt-5">
        <h3 className="font-bold text-ink">Sources & rights</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
          {(sources.rows as Array<{ provider: string; license_ref: string | null; collection_date: string | null; permitted_uses: string | null }>).map((s, i) => (
            <li key={i}>
              {s.provider} · license {s.license_ref ?? "—"} · collected {formatDate(s.collection_date)} · {s.permitted_uses ?? "—"}
            </li>
          ))}
          {sources.rows.length === 0 ? <li>No source records (seed fixture).</li> : null}
        </ul>
      </Card>

      <Card className="mt-5">
        <h3 className="font-bold text-ink">Verification history</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
          {(verifications.rows as Array<{ method: string; result: string; checked_at: string }>).map((v, i) => (
            <li key={i}>
              {v.method}: {v.result} · {formatDate(v.checked_at)}
            </li>
          ))}
          {verifications.rows.length === 0 ? <li>No verification records.</li> : null}
        </ul>
      </Card>
    </AdminShell>
  );
}
