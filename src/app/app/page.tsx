import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { getBalancesForRequest } from "@/server/services/credits";
import { getPendingProfileReview, hasApprovedProfile } from "@/server/services/resumes";
import { listDrafts } from "@/server/services/drafts";
import { upcomingReminders, STAGES } from "@/server/services/opportunities";
import { getConnection } from "@/server/services/gmail";
import { Card, Metric, StatusChip } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconAlert,
  IconArrowRight,
  IconBee,
  IconCompose,
  IconDraft,
  IconInfo,
  IconPerson,
  IconRadar,
  IconSend,
  IconToken,
} from "@/components/svg/icons";
import { OutreachPath, StageChain } from "@/components/svg/composite";
import { CountUp, Reveal, Stagger } from "@/components/motion";
import { relativeTime, formatDateTime } from "@/lib/format";
import { getConfig } from "@/server/config";
import { cn } from "@/lib/cn";

/**
 * Dashboard (§12.2): setup states from real data, balances, next actions from
 * user-created reminders, recent drafts with real status. Only true metrics —
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Reveal className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">
            Welcome back{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.
          </p>
          <h2 className="text-[1.75rem] font-extrabold tracking-tight text-ink">Outreach Co-Pilot</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/contacts"
            className="ab-press flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-ink-soft"
          >
            <IconRadar size={16} />
            Find Decision-Makers
          </Link>
          <Link
            href="/app/drafts/new"
            className="ab-press flex min-h-11 items-center gap-2 rounded-control border border-border-control bg-surface px-3.5 text-sm font-semibold text-ink hover:bg-surface-subtle"
          >
            <IconCompose size={15} />
            Custom Draft
          </Link>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <Card raised className="border-honey/45 bg-honey-wash/25 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <IconBee size={16} className="text-honey-deep" />
                Search, draft, and stage in one pass
              </h3>
              <OutreachPath
                steps={[
                  { label: "Find a verified contact", icon: <IconRadar size={13} className="text-text-secondary" /> },
                  { label: "Grounded draft from your facts", icon: <IconDraft size={13} className="text-text-secondary" /> },
                  { label: "Staged in Gmail drafts", icon: <IconSend size={13} className="text-text-secondary" /> },
                ]}
              />
            </div>
            <Link
              href="/app/contacts"
              className="ab-press inline-flex shrink-0 items-center gap-1.5 rounded-control bg-ink px-4 py-2.5 text-xs font-semibold text-surface hover:bg-ink-soft"
            >
              Start reaching out
              <IconArrowRight size={13} className="ab-slide-icon" />
            </Link>
          </div>
        </Card>
      </Reveal>

      <Stagger as="section" className="grid gap-4 md:grid-cols-3">
        <Card interactive className="space-y-2">
          <Metric
            label="Contact reveals"
            value={<CountUp value={balances.contact.available} />}
            meter={
              balances.contact.reserved > 0 ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <IconAlert size={13} />
                  {balances.contact.reserved} reserved for open reveals
                </div>
              ) : (
                <p className="text-xs text-text-disabled">Nothing reserved</p>
              )
            }
          />
        </Card>
        <Card interactive className="space-y-2">
          <Metric
            label="AI generations"
            value={<CountUp value={balances.ai.available} />}
            meter={
              balances.ai.reserved > 0 ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-info">
                  <IconInfo size={13} />
                  {balances.ai.reserved} in progress
                </div>
              ) : (
                <p className="text-xs text-text-disabled">Nothing running</p>
              )
            }
          />
        </Card>
        <Card interactive className="space-y-2">
          <p className="text-sm font-semibold text-text-secondary">Gmail</p>
          <p className="mt-1 truncate text-[1.05rem] font-bold leading-snug text-ink">
            {gmail ? gmail.googleEmail : config.gmailMode === "mock" ? "Sandbox mode" : "Not connected"}
          </p>
          <div className="pt-1">
            <StatusChip
              status={gmail ? "success" : "neutral"}
              label={gmail ? "Connected · drafts only" : "Optional"}
            />
          </div>
        </Card>
      </Stagger>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          {nextSteps.map((s, i) => (
            <Reveal key={s.title} delay={i * 50} className="group">
              <Card interactive>
                <div className="flex items-start gap-4">
                  <StepGlyph tone={s.tone}>{s.icon}</StepGlyph>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-text-secondary">{s.body}</p>
                    <Link
                      href={s.href}
                      className="ab-press mt-3 inline-flex items-center gap-1.5 rounded-control border border-border-control px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-subtle"
                    >
                      {s.cta}
                      <IconArrowRight size={14} className="ab-slide-icon" />
                    </Link>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}

          <Reveal delay={120}>
            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold text-ink">Recent drafts</h3>
                <Link
                  href="/app/drafts"
                  className="ab-press flex items-center gap-1 rounded-control px-2 py-1 text-sm font-semibold text-ink hover:bg-surface-subtle"
                >
                  All drafts
                  <IconArrowRight size={13} className="ab-slide-icon" />
                </Link>
              </div>
              {recentDrafts.length === 0 ? (
                <EmptyState
                  art="drafts"
                  title="No drafts yet"
                  description="Write your first introduction, manually for free, or with a quick AI draft."
                  action={
                    <Link
                      href="/app/drafts/new"
                      className="ab-press inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft"
                    >
                      <IconCompose size={15} />
                      Start writing
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-border-decorative">
                  {recentDrafts.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/app/drafts/${d.id}`}
                        className="group flex items-center justify-between gap-3 rounded-control px-2 py-3 transition-colors hover:bg-surface-subtle/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{d.subject || "(no subject)"}</p>
                          <p className="text-xs text-text-secondary">
                            {d.mode === "manual" ? "Manual" : d.mode === "agentic" ? "Agentic" : "Quick AI"} · updated{" "}
                            {relativeTime(d.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusChip
                            status={d.status === "generating" ? "info" : "neutral"}
                            busy={d.status === "generating"}
                            label={d.status === "generating" ? "Generating" : "Draft"}
                          />
                          <IconArrowRight
                            size={14}
                            className="ab-slide-icon shrink-0 text-text-disabled group-hover:text-ink"
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>
        </div>

        <div className="space-y-4">
          <Reveal delay={60}>
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
                      <Link
                        href={`/app/pipeline/${r.id}`}
                        className="ab-press group flex items-center justify-between gap-2 rounded-control border border-border-decorative bg-canvas px-3 py-2.5 hover:border-ink/25 hover:bg-surface-subtle"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {r.roleTitle} · {r.companyName}
                          </span>
                          <span className="block text-xs text-text-secondary">{formatDateTime(r.nextActionAt)}</span>
                        </span>
                        <IconArrowRight size={14} className="ab-slide-icon shrink-0 text-text-disabled group-hover:text-ink" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>

          <Reveal delay={110}>
            <Card>
              <h3 className="font-bold text-ink">Your pipeline</h3>
              <p className="mt-1 text-xs text-text-secondary">
                Stages are updated by you. ReachBee doesn’t read your inbox.
              </p>
              <StageChain items={STAGES} className="mt-4" />
              <Link
                href="/app/pipeline"
                className="ab-press mt-4 inline-flex items-center gap-1.5 rounded-control border border-border-control px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-subtle"
              >
                Open pipeline
                <IconArrowRight size={14} className="ab-slide-icon" />
              </Link>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

const glyphTones = {
  warning: "border-warning/35 bg-warning-wash text-warning",
  info: "border-info/35 bg-info-wash text-info",
  honey: "border-honey/60 bg-honey-wash text-honey-deep",
};

function StepGlyph({ tone, children }: { tone: keyof typeof glyphTones; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-control border",
        glyphTones[tone],
      )}
    >
      {children}
    </span>
  );
}
