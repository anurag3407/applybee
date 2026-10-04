import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Gmail connection result" };

const MESSAGES: Record<string, { title: string; tone: "success" | "warning" | "danger"; body: string }> = {
  connected: {
    title: "Gmail connected",
    tone: "success",
    body: "Drafts you approve can now be created in your mailbox. Nothing is ever sent automatically.",
  },
  declined: {
    title: "Connection declined",
    tone: "warning",
    body: "You declined the Gmail permission. Everything else keeps working — copy and export are always available.",
  },
  partial_scope: {
    title: "Permission incomplete",
    tone: "warning",
    body: "The Gmail draft permission wasn’t fully granted, so delivery is disabled. You can try connecting again.",
  },
  state_invalid_or_expired: {
    title: "Connection attempt expired",
    tone: "warning",
    body: "The connection request timed out or was already used. Start again from Integrations.",
  },
  invalid_grant: {
    title: "Google rejected the authorization",
    tone: "danger",
    body: "The authorization code was invalid or expired. Please try connecting again.",
  },
  access_denied: {
    title: "Connection declined",
    tone: "warning",
    body: "Access was denied at Google’s consent screen. You can retry or keep using copy/export.",
  },
};

export default async function GmailResultPage({ searchParams }: { searchParams: Promise<{ result?: string; reason?: string; mailbox?: string }> }) {
  const { result, reason, mailbox } = await searchParams;
  const key = result === "error" ? (reason ?? "error") : (result ?? "error");
  const message =
    MESSAGES[key] ??
    {
      title: "Connection didn’t complete",
      tone: "danger" as const,
      body: `Something went wrong (${key ?? "unknown reason"}). No tokens were stored. Try again from Integrations.`,
    };
  const toneClasses =
    message.tone === "success" ? "border-success/30 bg-success-wash text-success" : message.tone === "warning" ? "border-warning/30 bg-warning-wash text-warning" : "border-danger/30 bg-danger-wash text-danger";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-ink">Gmail connection</h2>
      <Card className={toneClasses}>
        <h3 className="text-lg font-bold">{message.title}</h3>
        <p className="mt-2 text-sm text-ink">{message.body}</p>
        {result === "connected" && mailbox ? (
          <p className="mt-2 text-sm font-semibold text-ink">Connected mailbox: {mailbox}</p>
        ) : null}
        <p className="mt-3 text-xs text-ink/80">
          No OAuth codes, tokens, or state parameters are kept in this page’s address — the callback redirected here cleanly.
        </p>
      </Card>
      <div className="flex gap-3">
        <Link href="/app/settings/integrations" className="rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:bg-ink-soft">
          Back to integrations
        </Link>
        <Link href="/app/drafts" className="rounded-control border border-border-control px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
          Go to drafts
        </Link>
      </div>
    </div>
  );
}
