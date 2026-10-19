import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { getBalancesForRequest } from "@/server/services/credits";
import { getPendingProfileReview, hasApprovedProfile } from "@/server/services/resumes";
import { listDrafts } from "@/server/services/drafts";
import { upcomingReminders, STAGES } from "@/server/services/opportunities";
import { getConnection } from "@/server/services/gmail";
import { Metric, StatusChip } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconArrowRight,
  IconCompose,
  IconDraft,
  IconInfo,
  IconPerson,
  IconRadar,
  IconSend,
  IconToken,
} from "@/components/svg/icons";
import { StageChain } from "@/components/svg/composite";
import { CountUp, Reveal, Stagger } from "@/components/motion";
import { relativeTime, formatDateTime } from "@/lib/format";
import { getConfig } from "@/server/config";
import { cn } from "@/lib/cn";

/**
 * Dashboard (§12.2): setup states from real data, balances, next actions from
 * user-created reminders, recent drafts with real status. Only true metrics:
 * no "emails sent" or "replies" (they cannot be inferred).
 */
export default async function DashboardPage() {
  const user = await requireActiveUser();
  const [balances, profileReady, drafts, reminders, gmail, config, pendingReview] = await Promise.all([
    getBalancesForRequest(user.id),
    hasApprovedProfile(user.id),
    listDrafts(user.id),
    upcomingReminders(user.id),
    getConnection(user.id),
    getConfig(),
    getPendingProfileReview(user.id),
  ]);

  const nextSteps: Array<{ icon: React.ReactNode; title: string; body: string; href: string; cta: string; tone: "warning" | "info" | "honey" }> = [];
  if (!profileReady) {
    nextSteps.push({
      icon: <IconPerson size={16} />,
      title: "Confirm your profile",
      body: "AI drafts use only details you have confirmed. Add facts from your resume or type them in.",
      href: "/app/profile",
      cta: "Confirm profile",
      tone: "warning",
    });
  }
  if (pendingReview) {
    nextSteps.push({
      icon: <IconDraft size={16} />,
      title: "Your newest details are not in use yet",
      body: `${pendingReview.factCount} ${pendingReview.factCount === 1 ? "detail" : "details"} from your latest upload are waiting for review. Until you confirm them, AI drafts are written from the older profile you confirmed.`,
      href: "/app/profile",
      cta: "Review and confirm",
      tone: "info",
    });
  }
  if (balances.ai.available < 1 && balances.ai.reserved < 1) {
    nextSteps.push({
      icon: <IconToken size={16} />,
      title: "Add AI credits",
      body: "You have no copilot credits left. Manual writing stays free. Or top up and pick up where you left off.",
      href: "/app/billing/plans",
      cta: "See packs",
      tone: "warning",
    });
  }
  if (config.FEATURE_GMAIL_ENABLED && !gmail && config.gmailMode === "live") {
    nextSteps.push({
      icon: <IconSend size={16} />,
      title: "Connect Gmail (optional)",
      body: "Create approved drafts directly in your mailbox. Everything else works without it.",
      href: "/app/settings/integrations",
      cta: "Connect",
      tone: "info",
    });
  }
  if (nextSteps.length === 0) {
    nextSteps.push({
      icon: <IconRadar size={16} />,
      title: "Find a relevant contact",
      body: "Search the directory by role and location, then write an introduction grounded in your confirmed facts.",
      href: "/app/contacts",
      cta: "Find contacts",
      tone: "honey",
    });
  }

  const recentDrafts = drafts.slice(0, 5);
  const firstName = user.displayName?.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal className="flex flex-wrap items-end justify-between gap-5 border-b border-border-decorative pb-7">
        <div>
          <p className="text-[0.75rem] font-semibold text-text-secondary">Overview</p>
          <h1 className="mt-2 text-[clamp(1.75rem,3.2vw,2.35rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            Welcome back{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-2.5 max-w-[54ch] text-[0.9375rem] leading-[1.65] text-text-secondary">
            Your credits, drafts, and next actions. Nothing leaves without your review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/contacts"
            className="ab-press flex min-h-10 items-center gap-2 rounded-control bg-ink px-4 text-[0.8125rem] font-semibold text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-ink-soft"
          >
            <IconRadar size={15} />
            Find a contact
          </Link>
          <Link
            href="/app/drafts/new"
            className="ab-press flex min-h-10 items-center gap-2 rounded-control border border-border-control/70 px-3.5 text-[0.8125rem] font-semibold text-ink hover:bg-surface-subtle"
          >
            <IconCompose size={14} />
            New draft
          </Link>
        </div>
      </Reveal>

      <Stagger as="section" aria-label="Account status" className="grid border-b border-border-decorative md:grid-cols-3">
        <div className="py-6 md:border-r md:border-border-decorative md:pr-8">
          <Metric
            label="Contact reveals"
            value={<CountUp value={balances.contact.available} />}
            meter={
              balances.contact.reserved > 0 ? (
                <p className="text-[0.75rem] font-semibold text-warning">
                  {balances.contact.reserved} reserved for open reveals
                </p>
              ) : (
                <p className="text-[0.75rem] text-text-disabled">Nothing reserved</p>
              )
            }
          />
        </div>
        <div className="border-t border-border-decorative py-6 md:border-r md:border-t-0 md:px-8">
          <Metric
            label="AI generations"
            value={<CountUp value={balances.ai.available} />}
            meter={
              balances.ai.reserved > 0 ? (
                <p className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-info">
                  <IconInfo size={13} />
                  {balances.ai.reserved} in progress
                </p>
              ) : (
                <p className="text-[0.75rem] text-text-disabled">Nothing running</p>
              )
            }
          />
        </div>
        <div className="border-t border-border-decorative py-6 md:border-t-0 md:pl-8">
          <p className="text-[0.8125rem] font-semibold text-text-secondary">Gmail</p>
          <p className="mt-2 truncate text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            {gmail ? gmail.googleEmail : config.gmailMode === "mock" ? "Sandbox mode" : "Not connected"}
          </p>
          <div className="mt-2.5">
            <StatusChip
              status={gmail ? "success" : "neutral"}
              label={gmail ? "Connected · drafts only" : "Optional"}
            />
          </div>
        </div>
      </Stagger>

      <section className="grid gap-12 py-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <div className="min-w-0 space-y-11">
          <section aria-labelledby="needs-you">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="needs-you" className="text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">
                What needs you
              </h2>
              <p className="text-[0.75rem] font-semibold text-text-disabled">
                {nextSteps.length} {nextSteps.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            <Stagger as="ul" className="mt-4 border-t border-border-decorative">
              {nextSteps.map((step, i) => (
                <li key={step.title}>
                  <div className="flex items-start gap-4 border-b border-border-decorative py-5">
                    <StepGlyph tone={step.tone}>{step.icon}</StepGlyph>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="tabular text-[0.6875rem] font-semibold text-text-disabled">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">{step.title}</h3>
                      </div>
                      <p className="mt-1.5 max-w-[60ch] text-[0.875rem] leading-[1.65] text-text-secondary">{step.body}</p>
                      <Link
                        href={step.href}
                        className="ab-press group mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink underline decoration-border-control/70 underline-offset-4 hover:decoration-ink"
                      >
                        {step.cta}
                        <IconArrowRight size={13} className="ab-slide-icon" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </Stagger>
          </section>

          <section aria-labelledby="recent-drafts">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 id="recent-drafts" className="text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">
                  Recent drafts
                </h2>
                <p className="mt-1 text-[0.8125rem] text-text-secondary">Every draft waits for your review.</p>
              </div>
              <Link
                href="/app/drafts"
                className="ab-press flex items-center gap-1 rounded-control px-2 py-1 text-[0.8125rem] font-semibold text-ink hover:bg-surface-subtle"
              >
                All drafts
                <IconArrowRight size={13} className="ab-slide-icon" />
              </Link>
            </div>

            {recentDrafts.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  art="drafts"
                  title="No drafts yet"
                  description="Write your first introduction, manually for free, or with a quick AI draft."
                  action={
                    <Link
                      href="/app/drafts/new"
                      className="ab-press inline-flex min-h-10 items-center gap-2 rounded-control bg-ink px-4 text-[0.8125rem] font-semibold text-surface hover:bg-ink-soft"
                    >
                      <IconCompose size={14} />
                      Start writing
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 border-t border-border-decorative">
                {recentDrafts.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/app/drafts/${d.id}`}
                      className="group flex items-center justify-between gap-4 border-b border-border-decorative py-3.5 transition-colors hover:bg-surface-subtle/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[0.875rem] font-semibold text-ink">{d.subject || "(no subject)"}</p>
                        <p className="mt-0.5 text-[0.75rem] text-text-secondary">
                          {d.mode === "manual" ? "Manual" : d.mode === "agentic" ? "Agentic" : "Quick AI"} · updated{" "}
                          {relativeTime(d.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <StatusChip
                          status={d.status === "generating" ? "info" : "neutral"}
                          busy={d.status === "generating"}
                          label={d.status === "generating" ? "Generating" : "Draft"}
                        />
                        <IconArrowRight
                          size={14}
                          className="ab-slide-icon text-text-disabled group-hover:text-ink"
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-10">
          <Reveal delay={60}>
            <section aria-labelledby="next-actions">
              <h2 id="next-actions" className="text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">
                Next actions
              </h2>
              {reminders.length === 0 ? (
                <p className="mt-3 border-t border-border-decorative pt-4 text-[0.8125rem] leading-relaxed text-text-secondary">
                  Set a next-action date on a pipeline opportunity and it will show up here.
                </p>
              ) : (
                <ul className="mt-4 border-t border-border-decorative">
                  {reminders.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/app/pipeline/${r.id}`}
                        className="group flex items-center justify-between gap-3 border-b border-border-decorative py-3.5 hover:bg-surface-subtle/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[0.875rem] font-semibold text-ink">
                            {r.roleTitle} · {r.companyName}
                          </span>
                          <span className="mt-0.5 block text-[0.75rem] text-text-secondary">
                            {formatDateTime(r.nextActionAt)}
                          </span>
                        </span>
                        <IconArrowRight
                          size={14}
                          className="ab-slide-icon shrink-0 text-text-disabled group-hover:text-ink"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>

          <Reveal delay={110}>
            <section aria-labelledby="your-pipeline">
              <h2 id="your-pipeline" className="text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">
                Your pipeline
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-text-secondary">
                Stages are updated by you. ReachBee doesn’t read your inbox.
              </p>
              <div className="mt-4 border-y border-border-decorative py-4">
                <StageChain items={STAGES} />
              </div>
              <Link
                href="/app/pipeline"
                className="ab-press group mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink underline decoration-border-control/70 underline-offset-4 hover:decoration-ink"
              >
                Open pipeline
                <IconArrowRight size={13} className="ab-slide-icon" />
              </Link>
            </section>
          </Reveal>
        </aside>
      </section>
    </div>
  );
}

const glyphTones = {
  warning: "border-warning/35 text-warning",
  info: "border-info/35 text-info",
  honey: "border-honey-deep/45 text-honey-deep dark:text-honey",
};

function StepGlyph({ tone, children }: { tone: keyof typeof glyphTones; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-control border bg-surface",
        glyphTones[tone],
      )}
    >
      {children}
    </span>
  );
}
