import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getCompanyWithEvidence } from "@/server/services/contacts";
import { Badge, Card } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  await requireActiveUser();
  const { companyId } = await params;
  const data = await getCompanyWithEvidence(companyId);
  if (!data) notFound();
  const { company, evidence, contacts } = data;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">{company.name}</h2>
        <p className="text-sm text-text-secondary">
          {company.category ?? "Company"} · {company.location ?? "—"} · {company.stage ?? ""}
        </p>
      </div>
      <Card>
        <h3 className="font-bold text-ink">Approved company context</h3>
        <p className="text-xs text-text-secondary">Only dated, approved facts are shown here and used in AI drafts.</p>
        {evidence.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">No approved context yet.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {evidence.map((ev) => (
              <li key={ev.id} className="rounded-control border border-border-decorative bg-canvas px-3 py-2">
                <Badge tone="info">{ev.factType}</Badge>
                <p className="mt-1 text-sm text-ink">{ev.value}</p>
                <p className="mt-0.5 text-xs text-text-disabled">
                  Source: {ev.sourceName ?? "licensed provider"} · acquired {formatDate(ev.acquiredAt)} · checked {formatDate(ev.checkedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-text-disabled">No active vacancy is inferred from directory presence.</p>
      </Card>
      <Card>
        <h3 className="font-bold text-ink">People at {company.name}</h3>
        <ul className="mt-3 divide-y divide-border-decorative">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2.5">
              <div>
                <Link href={`/app/contacts/${c.id}`} className="text-sm font-semibold text-ink hover:underline">
                  {c.name}
                </Link>
                <p className="text-xs text-text-secondary">{c.title}</p>
              </div>
              <Badge tone={c.verificationStatus === "verified" ? "success" : "neutral"}>{c.verificationStatus}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
