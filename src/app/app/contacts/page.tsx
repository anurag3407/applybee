import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { searchDirectory } from "@/server/services/contacts";
import { getBalances } from "@/server/services/credits";
import { SearchToolbar } from "@/components/directory/search-toolbar";
import { RevealAction, SaveContactButton, WriteToContactButton, OneClickOutreachButton } from "@/components/directory/reveal";
import { Badge, Button, EmptyState, Card } from "@/components/ui/primitives";
import { CountUp, Reveal } from "@/components/motion";
import { relativeTime } from "@/lib/format";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Find contacts" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const ROLE_LABELS: Record<string, string> = {
  engineering_manager: "Eng manager",
  tech_lead: "Tech lead",
  vp_engineering: "VP / Director",
  recruiter: "Recruiter",
  founder: "Founder",
  other: "Other",
};

const DEPT_LABELS: Record<string, string> = {
  engineering: "Engineering",
  design: "Design",
  content: "Content",
  sales: "Sales",
  product_ops: "Product / Ops",
};

const VERIFICATION_TONES: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  verified: "success",
  catch_all: "warning",
  unknown: "neutral",
  invalid: "danger",
};

export default async function ContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireActiveUser();
  const sp = await searchParams;
  const { rows, nextCursor } = await searchDirectory(user.id, {
    q: one(sp.q),
    department: one(sp.dept),
    roleCategory: one(sp.role),
    location: one(sp.location),
    stage: one(sp.stage),
    verification: one(sp.verification),
    cursor: one(sp.cursor),
    pageSize: 25,
  });
  const balances = await getBalances(user.id);

  const nextParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val && k !== "cursor") nextParams.set(k, val);
  }
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Find contacts</h2>
          <p className="text-sm text-text-secondary">
            Browsing is free. Reveal shows a full address once for one credit. Reopening it is always free.
          </p>
        </div>
        <p className="tabular text-sm font-semibold text-ink">
          <CountUp value={balances.contact.available} /> contact{" "}
          {balances.contact.available === 1 ? "reveal" : "reveals"}
          {balances.contact.reserved > 0 ? ` · ${balances.contact.reserved} in use` : ""}
        </p>
      </div>

      <Suspense fallback={<div className="ab-shimmer h-11 rounded-control" />}>
        <SearchToolbar />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          art="contacts"
          title="No matching contacts"
          description="Try clearing a filter, or write to someone you already know by entering your own recipient in the composer."
          action={
            <Link href="/app/drafts/new">
              <Button variant="secondary">Write with your own recipient</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table (§12.3) */}
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Directory contacts</caption>
              <thead>
                <tr className="border-b border-border-decorative text-sm text-text-secondary">
                  <th scope="col" className="px-4 py-3 font-semibold">Name & title</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Company</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-decorative/70">
                {rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-subtle/50">
                    <td className="px-4 py-3">
                      <Link href={`/app/contacts/${c.id}`} className="font-bold text-ink hover:underline">
                        {c.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-text-secondary">{c.title}</span>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-surface-raised border border-border-control/50 text-text-secondary">
                          {DEPT_LABELS[c.department] ?? c.department}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{c.companyName}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.unlocked ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="success">Unlocked</Badge>
                          <code className="rounded-control border border-border-decorative bg-canvas px-2 py-0.5 text-xs font-semibold text-ink">
                            {c.maskedEmail}
                          </code>
                        </div>
                      ) : (
                        <RevealAction contactId={c.id} unlocked={false} initialEmail={null} initialBalance={balances.contact} maskedEmail={c.maskedEmail} contactName={c.name} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {c.unlocked ? (
                          <WriteToContactButton contactId={c.id} />
                        ) : (
                          <OneClickOutreachButton contactId={c.id} contactName={c.name} availableCredits={balances.contact.available} />
                        )}
                        <SaveContactButton contactId={c.id} saved={c.saved} />
                        <Link href={`/app/contacts/${c.id}`} className="ab-press flex min-h-9 items-center rounded-control border border-border-control px-2.5 text-xs font-semibold text-text-secondary hover:text-ink hover:bg-surface-subtle" title="View details and company context">
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards (§12.3): same labeled fields, no crushed tables */}
          <div className="space-y-3 md:hidden">
            {rows.map((c) => (
              <Card key={c.id} interactive>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/app/contacts/${c.id}`} className="font-bold text-ink">
                      {c.name}
                    </Link>
                    <p className="text-xs text-text-secondary">
                      {c.title} · {c.companyName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-surface-raised border border-border-control/50 text-text-secondary">
                        {DEPT_LABELS[c.department] ?? c.department}
                      </span>
                      <span className="text-xs text-text-secondary">{c.location ?? "—"}</span>
                    </div>
                  </div>
                  <Badge tone={VERIFICATION_TONES[c.verificationStatus] ?? "neutral"}>{c.verificationStatus}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {c.unlocked ? (
                    <>
                      <Badge tone="success">Unlocked</Badge>
                      <WriteToContactButton contactId={c.id} />
                    </>
                  ) : (
                    <>
                      <OneClickOutreachButton contactId={c.id} contactName={c.name} availableCredits={balances.contact.available} />
                      <RevealAction contactId={c.id} unlocked={false} initialEmail={null} initialBalance={balances.contact} maskedEmail={c.maskedEmail} contactName={c.name} />
                    </>
                  )}
                  <SaveContactButton contactId={c.id} saved={c.saved} />
                  <Link href={`/app/contacts/${c.id}`} className="ab-press flex min-h-9 items-center rounded-control border border-border-control px-3 text-xs font-semibold text-text-secondary hover:text-ink hover:bg-surface-subtle">
                    Details
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {nextCursor ? (
            <div className="flex justify-center">
              <Link href={`?${nextParams.toString()}`}>
                <Button variant="secondary">Load more</Button>
              </Link>
            </div>
          ) : null}
        </>
      )}

      <p className="text-xs text-text-disabled">
        “Verified” reflects an email check at the shown date, not hiring intent or consent to outreach. Employment
        freshness is tracked separately. Listing a contact never implies an active vacancy.
      </p>
    </div>
  );
}
