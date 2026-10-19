import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getDraftForUser, listTemplates } from "@/server/services/drafts";
import { getBalancesForRequest } from "@/server/services/credits";
import { getPendingProfileReview, getProfileForUser, hasApprovedProfile, listResumes } from "@/server/services/resumes";
import { getConnection } from "@/server/services/gmail";
import { getConfig } from "@/server/config";
import { Composer } from "@/components/composer/composer";

export const metadata: Metadata = { title: "Composer" };

export default async function DraftEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ draftId: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const user = await requireActiveUser();
  const { draftId } = await params;
  const { template: templateParam } = await searchParams;
  const data = await getDraftForUser(user.id, draftId);
  if (!data || data.draft.status === "deleted") notFound();

  const [balances, profileReady, resumes, gmail, config, pendingReview, profile, templates] = await Promise.all([
    getBalancesForRequest(user.id),
    hasApprovedProfile(user.id),
    listResumes(user.id),
    getConnection(user.id),
    import("@/server/config").then((m) => m.getConfig()),
    getPendingProfileReview(user.id),
    getProfileForUser(user.id),
    listTemplates(user.id),
  ]);
  const profileTargetRole = (profile.revision?.extracted as { targetRole?: string | null } | null)?.targetRole ?? "";
  const sampleAchievement =
    profile.facts.find((f) => f.factType === "achievement" || f.factType === "project")?.text ?? null;
  const initialTemplateId =
    templateParam && templates.some((t) => t.id === templateParam) ? templateParam : null;

  const gen = data.latestGeneration;
  const del = data.latestDelivery;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border-decorative pb-4">
        <div>
          <p className="text-xs font-semibold text-text-secondary">Drafts</p>
          <h1 className="mt-1 text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">Write an introduction</h1>
        </div>
        <Link href="/app/drafts" className="text-sm font-semibold text-text-secondary underline hover:text-ink">
          All drafts
        </Link>
      </div>
      <Composer
        draftId={draftId}
        initial={{
          subject: data.currentRevision?.subject ?? "",
          body: data.currentRevision?.body ?? "",
          version: data.draft.currentVersion,
          mode: data.draft.mode,
          intent: data.draft.intent,
        }}
        recipient={data.recipient}
        balances={balances}
        gmail={{
          connected: Boolean(gmail),
          email: gmail?.googleEmail ?? null,
          mode: config.gmailMode,
        }}
        hasApprovedProfile={profileReady}
        candidateName={user.displayName ?? ""}
        profileTargetRole={profileTargetRole}
        pendingProfileReview={pendingReview}
        resumeOptions={resumes
          .filter(
            (r) =>
              r.scanStatus === "clean" &&
              !["upload_pending", "uploaded", "scanning", "deleted", "deleting", "failed", "scanning_rejected"].includes(r.state),
          )
          .map((r) => ({ id: r.id, name: r.displayFilename, scanned: r.scanStatus === "clean" }))}
        templates={templates.map((t) => ({ id: t.id, name: t.name, subject: t.subject, body: t.body }))}
        initialTemplateId={initialTemplateId}
        sampleAchievement={sampleAchievement}
        initialGeneration={
          gen
            ? {
                id: gen.id,
                state: gen.state,
                acceptanceState: gen.acceptanceState,
                proposedRevisionId: gen.proposedRevisionId,
                failureCode: gen.failureCode,
                failureMessage: gen.failureMessage,
                proposal: data.pendingProposal,
                usage: gen.usage as { factsUsed?: number; warnings?: string[] } | null,
              }
            : null
        }
        initialDelivery={
          del ? { id: del.id, state: del.state, failureCode: del.failureCode, failureMessage: del.failureMessage, providerDraftId: del.providerDraftId } : null
        }
      />
    </div>
  );
}
