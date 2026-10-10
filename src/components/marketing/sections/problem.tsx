import { FeatureCard, PreviewPanel, SectionShell } from "@/components/marketing/sections/shell";
import { CombTrace } from "@/components/marketing/atmosphere";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §3 — the problem, stated from the applicant's side. The "portal breakdown"
 * panel is the diagnosis; the three cards are the reasons a direct, technical
 * introduction behaves differently. No invented market statistics.
 */
export function Problem() {
  const frictions: Array<{ icon: FeatureIconName; title: string; body: string }> = [
    {
      icon: "directory",
      title: "The 500+ applicant black hole",
      body: "Public postings on LinkedIn and Indeed collect hundreds of automated submissions in minutes. Opaque ATS keyword filters discard competent engineers before a human ever looks.",
    },
    {
      icon: "grounding",
      title: "Direct engineering alignment",
      body: "Corporate recruiters are evaluated on gatekeeping and compliance. Engineering Managers and Founders are motivated by stack fit, code quality, and immediate problem-solving. ReachBee bridges you to technical peers.",
    },
    {
      icon: "cap",
      title: "Grounding beats AI slop",
      body: "Hiring managers delete generic AI cover letters on sight. The Grounding Engine binds your verified achievements to the target stack: no fabricated percentages, no invented claims.",
    },
  ];

  return (
    <SectionShell
      id="problem"
      eyebrow="Market problem"
      heading={
        <>
          Beyond saturated job portals.
          <br className="hidden sm:block" /> Direct to technical{" "}
          <span className="whitespace-nowrap">decision-makers.</span>
        </>
      }
      lede="Traditional application funnels have broken down under bot spam and algorithmic black holes. Applying into portal forms leaves your career to chance in a 500-resume stack."
    >
      <div className="grid gap-5 lg:grid-cols-3" data-motion="stagger">
        {frictions.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>

      <PreviewPanel
        className="mt-8"
        label="The portal breakdown"
        aside={
          <span className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-text-disabled">
            <CombTrace cells={5} size={12} className="text-honey" />
            Diagnosis
          </span>
        }
      >
        <p className="prose-measure text-[0.9375rem] leading-relaxed text-text-secondary">
          A posting that once collected a few dozen applications now collects hundreds of automated ones within minutes.
          Keyword filters sort on tokens, not on what you can actually build — so the stack you know rarely gets you
          past the first screen, and the person who would hire you never sees the application at all.
        </p>
        <p className="prose-measure mt-4 text-[0.9375rem] font-semibold leading-relaxed text-ink">
          ReachBee is the precision alternative: direct, truthful outreach to the engineering leads who evaluate
          technical merit.
        </p>
      </PreviewPanel>
    </SectionShell>
  );
}
