import { PreviewPanel, QuietLink, SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { cn } from "@/lib/cn";

/**
 * §8 — the workspace. Six real stage names, one active card, and no reply
 * metrics. The note says why.
 */
export function WorkspaceTeaser({ standalone = false }: { standalone?: boolean }) {
  const stages = ["Interested", "Draft ready", "Contacted", "Conversation", "Interview", "Offer"];
  const cards = [
    { company: "Meridian Cloud", role: "Platform engineer", stage: "Draft ready", next: "Follow up Thursday" },
    { company: "Arambh Fintech", role: "Backend role", stage: "Conversation", next: "Spoke to Meera on Tuesday" },
  ];

  return (
    <SectionShell
      tone="surface"
      id="workspace"
      index={standalone ? undefined : "07"}
      eyebrow="Hiring workspace"
      heading="Keep your next move in view."
      lede="Notes and next-action dates matter more than vanity charts. Reminders appear inside ReachBee, and nothing is sent automatically."
    >
      <div className="grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-16">
        <PreviewPanel label="Pipeline · Illustrative">
          <ol className="grid grid-cols-3 gap-x-3 gap-y-4 border-b border-border-decorative pb-5 sm:grid-cols-6" data-motion="stagger">
            {stages.map((s, i) => {
              const active = i === 1;
              const done = i < 1;
              return (
                <li key={s} data-motion="stagger-item">
                  <span
                    aria-hidden
                    className={cn(
                      "block h-px w-full",
                      active ? "bg-honey" : done ? "bg-ink/40" : "bg-border-decorative",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-2.5 block text-[0.6875rem] font-semibold leading-snug",
                      active ? "text-ink" : "text-text-disabled",
                    )}
                  >
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>

          <ul className="mt-2">
            {cards.map((c) => (
              <li
                key={c.company}
                className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border-decorative py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-semibold text-ink">
                    {c.company} <span className="font-normal text-text-secondary">· {c.role}</span>
                  </p>
                  <p className="mt-1 text-[0.75rem] text-text-disabled">Next step: {c.next}</p>
                </div>
                <span className="text-[0.6875rem] font-semibold text-honey-deep dark:text-honey">{c.stage}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-center gap-2 text-[0.75rem] font-medium text-text-secondary">
            <FeatureIcon name="privacy" size={13} />
            Stages are updated by you. We do not read your inbox.
          </p>
        </PreviewPanel>

        <div className="flex flex-col justify-center" data-motion="reveal">
          <p className="text-[1rem] leading-[1.75] text-text-secondary">
            Every opportunity keeps its own notes, next action, and date, so following up is a decision you can see,
            not a thread you have to remember.
          </p>
          <ul className="mt-7 border-t border-border-decorative">
            {[
              { icon: "review" as const, text: "You set the stage, by hand." },
              { icon: "privacy" as const, text: "No inbox access, no reply tracking." },
              { icon: "cost" as const, text: "No subscription, no auto-renewal." },
            ].map((r) => (
              <li
                key={r.text}
                className="flex items-center gap-3 border-b border-border-decorative py-3.5 text-[0.875rem] text-ink"
              >
                <FeatureIcon name={r.icon} size={16} className="shrink-0 text-honey-deep dark:text-honey" />
                {r.text}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <QuietLink href="/sign-up">See the workspace</QuietLink>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
