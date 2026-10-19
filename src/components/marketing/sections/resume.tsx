import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";

function HexNode() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden>
      <path d="M11 1.4l9 5.2v10.8l-9 5.2-9-5.2V6.6z" fill="var(--ab-honey-wash)" stroke="var(--ab-honey-deep)" strokeWidth="1" />
      <path d="M7.6 12.2l2.3 2.3 4.7-5" fill="none" stroke="var(--ab-honey-deep)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * §5 — resume intelligence. Evidence on the left, the only sentences it
 * permits on the right. The unsupported line stays visibly out of the draft.
 */
export function ResumeIntelligence({ standalone = false }: { standalone?: boolean }) {
  const resumeLines = [
    { text: "Built an events pipeline handling 40k events/min", state: "confirmed" as const },
    { text: "Led migration of checkout service to TypeScript", state: "confirmed" as const },
    { text: "Reduced manual reporting time (no metric stated)", state: "open" as const },
  ];

  return (
    <SectionShell
      id="resume"
      index={standalone ? undefined : "04"}
      eyebrow="Grounding engine"
      heading="Your experience is the strongest part of the pitch."
      lede="Upload once, review what we extract, and keep the details that are accurate. The draft can only draw from what you have confirmed. Nothing else is in its reach."
    >
      <div className="grid items-stretch lg:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)]">
        <div className="rounded-card border border-border-decorative bg-surface shadow-card" data-motion="reveal">
          <div className="border-b border-border-decorative px-5 py-3.5">
            <p className="text-[0.75rem] font-semibold text-text-secondary">From your résumé</p>
          </div>
          <ul className="px-5 py-2">
            {resumeLines.map((l) => (
              <li
                key={l.text}
                className="flex items-start gap-3 border-b border-border-decorative/70 py-4 last:border-0"
              >
                <FeatureIcon
                  name={l.state === "confirmed" ? "grounding" : "review"}
                  size={16}
                  className={
                    l.state === "confirmed"
                      ? "mt-0.5 shrink-0 text-success"
                      : "mt-0.5 shrink-0 text-text-disabled"
                  }
                />
                <span className={l.state === "confirmed" ? "text-[0.875rem] leading-relaxed text-ink" : "text-[0.875rem] leading-relaxed text-text-disabled"}>
                  {l.text}
                </span>
                {l.state === "open" ? (
                  <span className="ml-auto shrink-0 text-[0.6875rem] font-semibold text-text-disabled">No metric</span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mx-5 mb-5 border-t border-border-decorative pt-4 text-[0.75rem] leading-relaxed text-text-secondary">
            Review the profile we extract. Keep the details that are accurate; fix the ones that are not.
          </p>
        </div>

        <div className="relative hidden items-center justify-center lg:flex" aria-hidden>
          <span className="absolute inset-y-8 left-1/2 w-px bg-border-decorative" />
          <span className="relative rounded-full border border-border-decorative bg-canvas p-1.5">
            <HexNode />
          </span>
        </div>

        <div className="mt-5 rounded-card border border-border-decorative bg-surface shadow-card lg:mt-0" data-motion="reveal">
          <div className="border-b border-border-decorative px-5 py-3.5">
            <p className="text-[0.75rem] font-semibold text-text-secondary">In the draft</p>
          </div>
          <div className="p-5">
            <div className="rounded-control border border-border-decorative bg-canvas px-4 py-4 text-[0.875rem] leading-[1.75] text-ink">
              Hi Priya, I built a realtime events pipeline last year
              <span className="mx-1 rounded-xs bg-honey-wash px-1.5 py-0.5 text-[0.6875rem] font-bold text-honey-deep dark:text-honey">
                fact 1
              </span>
              and would value a conversation about your platform work.
            </div>
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-text-secondary">
              Where your résumé gives no number, the draft stays qualitative. A missing metric is never replaced with
              a confident-sounding guess.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-decorative pt-4">
              <Badge tone="info">Résumé files stay private</Badge>
              <Link
                href="/legal/privacy"
                className="text-[0.8125rem] font-semibold text-ink underline decoration-border-control underline-offset-4"
              >
                How we handle them
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
