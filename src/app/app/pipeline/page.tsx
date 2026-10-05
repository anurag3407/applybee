import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listOpportunities, STAGES } from "@/server/services/opportunities";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { NewOpportunityButton } from "@/components/pipeline/opportunity-forms";
import { EmptyState, Button } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const user = await requireActiveUser();
  const rows = await listOpportunities(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Pipeline</h2>
          <p className="text-sm text-text-secondary">
            Stages are updated by you — ReachBee doesn’t read your inbox or infer progress. Follow-up reminders appear
            in-app only.
          </p>
        </div>
        <NewOpportunityButton />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Track companies and roles you care about. Draft creation can mark one “draft ready” — nothing is ever marked contacted automatically."
          action={<NewOpportunityButton />}
        />
      ) : (
        <PipelineBoard
          stages={STAGES}
          opportunities={rows.map((o) => ({
            id: o.id,
            companyName: o.companyName,
            roleTitle: o.roleTitle,
            stage: o.stage,
            nextActionAt: o.nextActionAt ? o.nextActionAt.toISOString() : null,
          }))}
        />
      )}

      <p className="text-xs text-text-disabled">
        <Link href="/help" className="underline">
          Why don’t I see replies or interview data?
        </Link>{" "}
        Because we don’t read your inbox — outcomes here are entered by you.
      </p>
    </div>
  );
}
