import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getOpportunity, STAGES } from "@/server/services/opportunities";
import { StageControls } from "@/components/pipeline/stage-controls";
import { OpportunityNotes } from "@/components/pipeline/opportunity-notes";
import { Card, Badge } from "@/components/ui/primitives";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Opportunity" };

export default async function OpportunityDetailPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const user = await requireActiveUser();
  const { opportunityId } = await params;
  const data = await getOpportunity(user.id, opportunityId);
  if (!data) notFound();
  const { opportunity: opp, notes } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        <Link href="/app/pipeline" className="underline">Pipeline</Link> <span aria-hidden>/</span>{" "}
        <span className="font-semibold text-ink">{opp.roleTitle}</span>
      </nav>

      <AppPageHeader
        title={opp.roleTitle}
        lede={
          <>
            {opp.companyName}
            <span className="block text-text-disabled">Timezone: {opp.timezone}</span>
          </>
        }
        actions={<Badge>{STAGES.find((s) => s.key === opp.stage)?.label ?? opp.stage}</Badge>}
      />

      <Card>
        {opp.jobUrl ? (
          <a href={opp.jobUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-info underline">
            Job posting (opens safely in a new tab)
          </a>
        ) : null}
        <div className="mt-4">
          <StageControls opportunityId={opp.id} stage={opp.stage} nextActionAt={opp.nextActionAt ? opp.nextActionAt.toISOString() : null} />
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink">Notes</h3>
        <OpportunityNotes opportunityId={opp.id} />
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-control border border-border-decorative bg-canvas px-3 py-2">
              <p className="text-sm text-ink">{n.body}</p>
              <p className="mt-0.5 text-xs text-text-disabled">{formatDateTime(n.createdAt)}</p>
            </li>
          ))}
          {notes.length === 0 ? <li className="text-sm text-text-secondary">No notes yet.</li> : null}
        </ul>
      </Card>

      <p className="text-xs text-text-disabled">
        Stage and outcome are self-reported. Draft creation never implies “contacted”. Only you know when you hit send.
      </p>
    </div>
  );
}
