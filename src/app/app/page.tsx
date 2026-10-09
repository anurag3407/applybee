import Link from "next/link";
import { ArrowRight, Sparkles, Mail, FileText, AlertCircle, Search } from "lucide-react";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { getPendingProfileReview, hasApprovedProfile } from "@/server/services/resumes";
import { listDrafts } from "@/server/services/drafts";
import { upcomingReminders, STAGES } from "@/server/services/opportunities";
import { getConnection } from "@/server/services/gmail";
import { Card, Badge, EmptyState } from "@/components/ui/primitives";
import { relativeTime, formatDateTime } from "@/lib/format";
import { getConfig } from "@/server/config";

/**
 * Dashboard (§12.2): setup states from real data, balances, next actions from
 * user-created reminders, recent drafts with real status. Only true metrics —
 * no "emails sent" or "replies" (they cannot be inferred).
 */
export default async function DashboardPage() {
  const user = await requireActiveUser();
  const [balances, profileReady, drafts, reminders, gmail, config, pendingReview] = await Promise.all([
    getBalances(user.id),
    hasApprovedProfile(user.id),
    listDrafts(user.id),
    upcomingReminders(user.id),
    getConnection(user.id),
    getConfig(),
    getPendingProfileReview(user.id),
  ]);

  const nextSteps: Array<{ icon: React.ReactNode; title: string; body: string; href: string; cta: string }> = [];
  if (!profileReady) {
    nextSteps.push({
      icon: <AlertCircle size={16} aria-hidden className="text-warning" />,
      title: "Confirm your profile",
      body: "AI drafts use only details you have confirmed. Add facts from your resume or type them in.",
      href: "/app/profile",
      cta: "Confirm profile",
    });
  }
  if (pendingReview) {
    nextSteps.push({
      icon: <FileText size={16} aria-hidden className="text-info" />,
      title: "Your newest details are not in use yet",
      body: `${pendingReview.factCount} ${pendingReview.factCount === 1 ? "detail" : "details"} from your latest upload are waiting for review. Until you confirm them, AI drafts are written from the older profile you confirmed.`,
      href: "/app/profile",
      cta: "Review and confirm",
    });
  }
  if (balances.ai.available < 1 && balances.ai.reserved < 1) {
    nextSteps.push({
      icon: <Sparkles size={16} aria-hidden className="text-warning" />,
      title: "Add AI credits",
      body: "You have no copilot credits left. Manual writing stays free — or top up and pick up where you left off.",
      href: "/app/billing/plans",
      cta: "See packs",
    });
  }
  if (config.FEATURE_GMAIL_ENABLED && !gmail && config.gmailMode === "live") {
    nextSteps.push({
      icon: <Mail size={16} aria-hidden className="text-info" />,
      title: "Connect Gmail (optional)",
      body: "Create approved drafts directly in your mailbox. Everything else works without it.",
      href: "/app/settings/integrations",
      cta: "Connect",
    });
  }
  if (nextSteps.length === 0) {
    nextSteps.push({
      icon: <Sparkles size={16} aria-hidden className="text-honey-deep" />,
      title: "Find a relevant contact",
      body: "Search the directory by role and location, then write an introduction grounded in your confirmed facts.",
      href: "/app/contacts",
      cta: "Find contacts",
    });
  }

  const recentDrafts = drafts.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">Welcome back{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.</p>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Outreach Co-Pilot</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/contacts" className="flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft shadow-sm">
            <Search size={16} aria-hidden />
            Find Decision-Makers
          </Link>
          <Link href="/app/drafts/new" className="flex min-h-11 items-center gap-2 rounded-control border border-border-control px-3.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
            <FileText size={15} aria-hidden />
            Custom Draft
          </Link>
        </div>
      </section>

      <Card className="border-honey/40 bg-honey-wash/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Sparkles size={16} className="text-honey-deep" />
              1-Click Autonomous Outreach Engine
            </h3>
            <p className="text-xs text-text-secondary">
              1. Search verified leads → 2. AI crafts a 75-word bespoke pitch → 3. Push straight to your Gmail Drafts.
            </p>
          </div>
          <Link href="/app/contacts" className="inline-flex items-center justify-center gap-1.5 rounded-control bg-ink px-4 py-2 text-xs font-semibold text-surface hover:bg-ink-soft shrink-0">
            Start reaching out <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-text-disabled">Contact reveals</p>
          <p className="mt-1 text-3xl font-bold tabular text-ink">{balances.contact.available}</p>
          {balances.contact.reserved > 0 ? (
            <p className="text-xs font-semibold text-text-secondary">{balances.contact.reserved} reserved</p>
          ) : (
            <p className="text-xs text-text-disabled">Available now</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-text-disabled">AI generations</p>
          <p className="mt-1 text-3xl font-bold tabular text-ink">{balances.ai.available}</p>
          {balances.ai.reserved > 0 ? (
            <p className="text-xs font-semibold text-text-secondary">{balances.ai.reserved} in progress</p>
          ) : (
            <p className="text-xs text-text-disabled">Available now</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-text-disabled">Gmail</p>
          <p className="mt-1 font-bold text-ink">
            {gmail ? gmail.googleEmail : config.gmailMode === "mock" ? "Sandbox mode" : "Not connected"}
          </p>
          <p className="text-xs text-text-secondary">{gmail ? "Connected · drafts only" : "Optional — copy/export works without it"}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          {nextSteps.map((s) => (
            <Card key={s.title}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-ink">
                    {s.icon}
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-text-secondary">{s.body}</p>
                  <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ink underline">
                    {s.cta} <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-ink">Recent drafts</h3>
              <Link href="/app/drafts" className="text-sm font-semibold text-ink underline">
                All drafts
              </Link>
            </div>
            {recentDrafts.length === 0 ? (
              <EmptyState
                title="No drafts yet"
                description="Write your first introduction — manually for free, or with a quick AI draft."
                action={
                  <Link href="/app/drafts/new">
                    <Badge tone="honey">Start writing</Badge>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border-decorative">
                {recentDrafts.map((d) => (
                  <li key={d.id}>
                    <Link href={`/app/drafts/${d.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-surface-subtle/60">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{d.subject || "(no subject)"}</p>
                        <p className="text-xs text-text-secondary">
                          {d.mode === "manual" ? "Manual" : d.mode === "agentic" ? "Agentic" : "Quick AI"} · updated {relativeTime(d.updatedAt)}
                        </p>
                      </div>
                      <Badge tone={d.status === "generating" ? "info" : "neutral"}>{d.status === "generating" ? "Generating…" : "Draft"}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-ink">Next actions</h3>
            {reminders.length === 0 ? (
              <p className="mt-2 text-sm text-text-secondary">
                Set a next-action date on a pipeline opportunity and it will show up here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {reminders.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/pipeline/${r.id}`} className="block rounded-control border border-border-decorative bg-canvas px-3 py-2 hover:bg-surface-subtle">
                      <p className="text-sm font-semibold text-ink">
                        {r.roleTitle} · {r.companyName}
                      </p>
                      <p className="text-xs text-text-secondary">{formatDateTime(r.nextActionAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h3 className="font-bold text-ink">Your pipeline</h3>
            <p className="mt-1 text-xs text-text-secondary">Stages are updated by you. ReachBee doesn’t read your inbox.</p>
            <ol className="mt-3 space-y-1 text-sm">
              {STAGES.map((s, i) => (
                <li key={s.key} className="flex items-center gap-2 text-text-secondary">
                  <span aria-hidden className="tabular w-4 text-xs text-text-disabled">{i + 1}</span>
                  {s.label}
                </li>
              ))}
            </ol>
            <Link href="/app/pipeline" className="mt-3 inline-block text-sm font-bold text-ink underline">
              Open pipeline
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
