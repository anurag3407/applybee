import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getDraftForUser } from "@/server/services/drafts";
import { getBalances } from "@/server/services/credits";
import { hasApprovedProfile, listResumes } from "@/server/services/resumes";
import { getConnection } from "@/server/services/gmail";
import { getConfig } from "@/server/config";
import { Composer } from "@/components/composer/composer";

export const metadata: Metadata = { title: "Composer" };

export default async function DraftEditorPage({ params }: { params: Promise<{ draftId: string }> }) {
  const user = await requireActiveUser();
  const { draftId } = await params;
  const data = await getDraftForUser(user.id, draftId);
  if (!data || data.draft.status === "deleted") notFound();

  const [balances, profileReady, resumes, gmail, config] = await Promise.all([
    getBalances(user.id),
    hasApprovedProfile(user.id),
    listResumes(user.id),
    getConnection(user.id),
    import("@/server/config").then((m) => m.getConfig()),
  ]);

  const gen = data.latestGeneration;
  const del = data.latestDelivery;

  return (
    <div className="mx-auto max-w-7xl">
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
        resumeOptions={resumes
          .filter(
            (r) =>
              r.scanStatus === "clean" &&
              !["upload_pending", "uploaded", "scanning", "deleted", "deleting", "failed", "scanning_rejected"].includes(r.state),
          )
          .map((r) => ({ id: r.id, name: r.displayFilename, scanned: r.scanStatus === "clean" }))}
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
