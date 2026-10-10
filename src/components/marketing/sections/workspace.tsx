import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { PreviewPanel, SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { cn } from "@/lib/cn";

/**
 * §8 — the workspace. A pipeline board with six real stage names, one card in
 * "draft ready" and one in "conversation". Illustrative: no reply metrics, no
 * inferred outcomes, and the note at the bottom says why.
 */
export function WorkspaceTeaser() {
  const stages = ["Interested", "Draft ready", "Contacted", "Conversation", "Interview", "Offer"];
  const cards = [
    { company: "Meridian Cloud", role: "Platform engineer", stage: "Draft ready", next: "Follow up Thu" },
    { company: "Arambh Fintech", role: "Backend role", stage: "Conversation", next: "Spoke to Meera on Tue" },
  ];

  return (
    <SectionShell
      tone="surface"
      id="workspace"
      eyebrow="Hiring workspace"
      heading="Keep your next move in view."
      lede="Notes and next-action dates matter more than vanity charts. Reminders appear inside ReachBee, and nothing is sent automatically."
    >
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <PreviewPanel label="Pipeline · Illustrative">
          {/* Stage rail: an arrow of stages, not progress you have to earn. */}
          <div className="relative">
            <div className="flex flex-wrap gap-2" data-motion="stagger">
              {stages.map((s, i) => {
                const active = i === 1;
                const done = i < 1;
                return (
                  <span
                    key={s}
                    data-motion="stagger-item"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors",
                      active && "bg-honey text-on-honey",
                      !active && done && "border border-honey/40 text-honey-deep dark:text-honey",
                      !active && !done && "border border-border-control/40 text-text-secondary",
                    )}
                  >
                    {done ? <FeatureIcon name="grounding" size={11} /> : null}
                    {s}
                  </span>
                );
              })}
            </div>
            {/* The rail joins them: dashed, so it reads as a path, not a bar. */}
            <svg
              aria-hidden
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
              className="mt-3 h-0.5 w-full text-border-control/40"
            >
              <path d="M0 1h100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" fill="none" />
            </svg>
          </div>

          <ul className="mt-5 space-y-2.5">
            {cards.map((c) => (
              <li
                key={c.company}
                className="group rounded-card border border-border-decorative bg-canvas p-3.5 transition-[border-color,box-shadow] duration-[220ms] hover:border-ink/25 hover:shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-bold text-ink">
                    {c.company} <span className="font-normal text-text-secondary">· {c.role}</span>
                  </p>
                  <span className="rounded-pill bg-honey-wash px-2 py-0.5 text-[0.6875rem] font-bold text-ink">
                    {c.stage}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-text-disabled">Next step: {c.next}</p>
              </li>
            ))}
          </ul>

          <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-honey-deep dark:text-honey">
            <FeatureIcon name="privacy" size={13} />
            Stages are updated by you. We don’t read your inbox.
          </p>
        </PreviewPanel>

        <div className="flex flex-col justify-center gap-5" data-motion="reveal">
          <p className="text-[1.0625rem] leading-relaxed text-text-secondary">
            Every opportunity keeps its own notes, next action, and date — so following up is a decision you can see,
            not a thread you have to remember.
          </p>
          <ul className="space-y-3">
            {[
              { icon: "review" as const, text: "You set the stage, by hand." },
              { icon: "privacy" as const, text: "No inbox access, no reply tracking." },
              { icon: "cost" as const, text: "No subscription, no auto-renewal." },
            ].map((r) => (
              <li key={r.text} className="flex items-center gap-3 text-sm text-ink">
                <FeatureIcon name={r.icon} size={17} className="shrink-0 text-honey-deep dark:text-honey" />
                {r.text}
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className="inline-flex">
            <Button variant="accent" size="lg">
              See the workspace
            </Button>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
