import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getOpportunity, STAGES } from "@/server/services/opportunities";
import { StageControls } from "@/components/pipeline/stage-controls";
import { Card, Badge } from "@/components/ui/primitives";
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

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              {opp.roleTitle} · {opp.companyName}
            </h2>
            {opp.jobUrl ? (
              <a href={opp.jobUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-info underline">
                Job posting (opens safely in a new tab)
              </a>
            ) : null}
            <p className="text-xs text-text-disabled">Timezone: {opp.timezone}</p>
          </div>
          <Badge>{STAGES.find((s) => s.key === opp.stage)?.label ?? opp.stage}</Badge>
        </div>
        <div className="mt-4">
          <StageControls opportunityId={opp.id} stage={opp.stage} nextActionAt={opp.nextActionAt ? opp.nextActionAt.toISOString() : null} />
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink">Notes</h3>
        <NotesComposer opportunityId={opp.id} />
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
        Stage and outcome are self-reported. Draft creation never implies “contacted” — only you know when you hit send.
      </p>
    </div>
  );
}

function NotesComposer({ opportunityId }: { opportunityId: string }) {
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem("note") as HTMLTextAreaElement;
        if (!input.value.trim()) return;
        await fetch(`/api/v1/opportunities?id=${opportunityId}&action=note`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: input.value }),
        });
        input.value = "";
        window.location.reload();
      }}
    >
      <textarea
        name="note"
        rows={2}
        maxLength={5000}
        placeholder="Add a private note — e.g. “Spoke to Meera on Tuesday”"
        className="flex-1 rounded-control border border-border-control bg-surface px-3 py-2 text-ink"
      />
      <button type="submit" className="min-h-11 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft">
        Add note
      </button>
    </form>
  );
}
