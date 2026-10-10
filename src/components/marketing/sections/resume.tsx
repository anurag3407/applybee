import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { PreviewPanel, SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";

/**
 * §5 — resume intelligence. Two panels facing each other: what you confirmed
 * on the left, what the draft is allowed to say about it on the right. The
 * unverified row is the point of the section, so it keeps its own state.
 */
export function ResumeIntelligence() {
  const resumeLines = [
    { text: "Built an events pipeline handling 40k events/min", state: "confirmed" as const },
    { text: "Led migration of checkout service to TypeScript", state: "confirmed" as const },
    { text: "Reduced manual reporting time (no metric stated in resume)", state: "open" as const },
  ];

  return (
    <SectionShell
      id="resume"
      eyebrow="Grounding engine"
      heading="Your experience is the strongest part of the pitch."
      lede="Upload once, review what we extract, and keep the details that are accurate. The draft can only draw from what you have confirmed — nothing else is in its reach."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <PreviewPanel label="From your resume">
          <ul className="space-y-3">
            {resumeLines.map((l) => (
              <li
                key={l.text}
                className="flex items-start gap-3 rounded-control border border-border-decorative bg-canvas px-3.5 py-3 text-sm text-ink"
              >
                <FeatureIcon
                  name={l.state === "confirmed" ? "grounding" : "review"}
                  size={16}
                  className={l.state === "confirmed" ? "mt-0.5 shrink-0 text-success" : "mt-0.5 shrink-0 text-text-disabled"}
                />
                <span className="min-w-0">“{l.text}”</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Review the profile we extract. Keep the details that are accurate; fix the ones that aren’t.
          </p>
        </PreviewPanel>

        <div className="relative">
          <PreviewPanel label="In the draft" className="h-full">
            <div className="rounded-control border border-honey/40 bg-honey-wash/50 px-3.5 py-3.5 text-sm leading-relaxed text-ink">
              Hi Priya, I built a realtime events pipeline last year
              <span className="mx-1 rounded bg-honey-wash px-1.5 py-0.5 text-xs font-bold text-ink">fact 1</span>
              and would love to talk about your platform work.
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              Where your resume gives no number, the draft stays qualitative. A missing metric is never replaced with a
              confident-sounding guess.
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-3">
              <Badge tone="info">Resume files stay private</Badge>
              <Link href="/legal/privacy" className="text-sm font-semibold text-ink underline underline-offset-4">
                How we handle them
              </Link>
            </p>
          </PreviewPanel>
        </div>
      </div>
    </SectionShell>
  );
}
