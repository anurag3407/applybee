import Link from "next/link";
import { ArrowRight, Sparkles, Mail, FileText, AlertCircle } from "lucide-react";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { hasApprovedProfile } from "@/server/services/resumes";
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
  const [balances, profileReady, drafts, reminders, gmail, config] = await Promise.all([
    getBalances(user.id),
    hasApprovedProfile(user.id),
    listDrafts(user.id),
    upcomingReminders(user.id),
    getConnection(user.id),
    import("@/server/config").then((m) => m.getConfig()),
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
          <h2 className="text-2xl font-bold tracking-tight text-ink">Your workspace</h2>
        </div>
        <Link href="/app/drafts/new" className="flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft">
          <FileText size={16} aria-hidden />
          Create an introduction
        </Link>
      </section>

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
          {nextSteps.slice(0, 1).map((s) => (
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
            <p className="mt-1 text-xs text-text-secondary">Stages are updated by you. Apply Bee doesn’t read your inbox.</p>
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
