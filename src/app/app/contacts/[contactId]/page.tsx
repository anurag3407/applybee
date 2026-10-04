import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getContactForUser, getCompanyWithEvidence } from "@/server/services/contacts";
import { RevealAction, SaveContactButton, WriteToContactButton, ReportContactDialog } from "@/components/directory/reveal";
import { getBalances } from "@/server/services/credits";
import { Badge, Card, StatusChip } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactDetailPage({ params }: { params: Promise<{ contactId: string }> }) {
  const user = await requireActiveUser();
  const { contactId } = await params;
  const contact = await getContactForUser(user.id, contactId);
  if (!contact) notFound();
  const [balances, company] = await Promise.all([
    getBalances(user.id),
    getCompanyWithEvidence(contact.companyId).catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        <Link href="/app/contacts" className="underline">Find contacts</Link> <span aria-hidden>/</span>{" "}
        <span className="font-semibold text-ink">{contact.name}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-ink">{contact.name}</h2>
                <p className="text-text-secondary">
                  {contact.title} · {contact.companyName}
                </p>
                <p className="text-sm text-text-secondary">{contact.location ?? "—"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusChip
                  status={contact.verificationStatus === "verified" ? "success" : contact.verificationStatus === "catch_all" ? "warning" : contact.verificationStatus === "invalid" ? "danger" : "neutral"}
                  label={contact.verificationStatus === "catch_all" ? "Catch-all domain" : contact.verificationStatus}
                />
                {contact.status === "stale" ? <StatusChip status="warning" label="Employment may have changed" /> : null}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-text-disabled">Email</h3>
                <div className="mt-1">
                  <RevealAction
                    contactId={contact.id}
                    unlocked={contact.unlocked}
                    initialEmail={contact.email}
                    initialBalance={balances.contact}
                    companyName={contact.companyDomain}
                    contactName={contact.name}
                  />
                </div>
              </div>
              <p className="text-xs text-text-secondary">
                Email checked: {formatDate(contact.lastEmailCheckedAt)} · Employment checked: {formatDate(contact.employmentCheckedAt)}
              </p>
              <p className="text-xs text-text-disabled">
                Verified means the mailbox existed at check time. It never means “actively hiring” or consent to bulk
                outreach.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <SaveContactButton contactId={contact.id} saved={contact.saved} />
                {contact.unlocked ? <WriteToContactButton contactId={contact.id} /> : null}
                <ReportContactDialog contactId={contact.id} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="font-bold text-ink">{contact.companyName}</h3>
            <p className="text-sm text-text-secondary">{contact.companyDescription ?? "Company context comes from approved, dated sources only."}</p>
            <div className="mt-3">
              {company?.evidence.length ? (
                <ul className="space-y-2.5">
                  {company.evidence.slice(0, 4).map((ev) => (
                    <li key={ev.id} className="rounded-control border border-border-decorative bg-canvas px-3 py-2">
                      <Badge tone={ev.expiresAt && ev.expiresAt < new Date() ? "warning" : "info"}>{ev.factType}</Badge>
                      <p className="mt-1 text-sm text-ink">{ev.value}</p>
                      <p className="mt-0.5 text-xs text-text-disabled">
                        Source: {ev.sourceName ?? "licensed provider"} · checked {formatDate(ev.checkedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary">No approved company context yet. AI drafts will stay neutral about the company.</p>
              )}
            </div>
            <p className="mt-3 text-xs text-text-disabled">No active vacancy is implied by directory presence.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
