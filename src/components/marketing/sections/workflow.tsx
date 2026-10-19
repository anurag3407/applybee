import { NoteRow, PreviewPanel, QuietLink, SectionShell } from "@/components/marketing/sections/shell";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §6 — the agentic flow. Three steps, then the evidence the preparation pass
 * actually selected, including the row where there was nothing to select.
 */
export function AgenticWorkflow({ standalone = false }: { standalone?: boolean }) {
  const steps: Array<{ icon: FeatureIconName; title: string; body: string }> = [
    {
      icon: "manual",
      title: "Choose your context",
      body: "Pick the intent: advertised role, internship, referral, or speculative intro. Paste a job description or role notes if you have one.",
    },
    {
      icon: "agentic",
      title: "Prepare with evidence",
      body: "A bounded preparation step selects relevant confirmed facts and approved, dated company context. You see exactly what was used.",
    },
    {
      icon: "review",
      title: "Review with Soft-Bypass",
      body: "The draft arrives with its evidence references and an optional closing line offering to route through the official careers portal.",
    },
  ];

  return (
    <SectionShell
      tone="surface"
      id={standalone ? "agentic" : "how-it-works"}
      index={standalone ? undefined : "03"}
      eyebrow="Agentic drafting"
      heading="A little preparation. A much better introduction."
      lede="One bounded pass, then you. The preparation step is explainable because every line it used is listed beside the draft it produced."
    >
      <ol className="grid border-y border-border-decorative md:grid-cols-3" data-motion="stagger">
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-motion="stagger-item"
            className="border-b border-border-decorative py-7 last:border-b-0 md:border-b-0 md:border-r md:px-7 md:py-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
          >
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-1.5 w-1.5 bg-honey" />
              <span className="tabular text-[0.6875rem] font-semibold text-text-disabled">0{i + 1}</span>
            </div>
            <h3 className="mt-4 text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">{s.title}</h3>
            <p className="mt-2 text-[0.875rem] leading-[1.7] text-text-secondary">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <PreviewPanel
          label="Evidence panel (example)"
          aside={
            <span className="text-[0.6875rem] font-semibold text-text-disabled">Bounded · one pass</span>
          }
        >
          <ul className="grid gap-x-12 md:grid-cols-2" data-motion="stagger">
            <NoteRow stagger icon="grounding" label="Fact #12" iconClass="text-success">
              “Built an events pipeline handling 40k events/min,” confirmed by you.
            </NoteRow>
            <NoteRow stagger icon="cost" label="Company note" iconClass="text-info">
              “Public job posts mention Kafka, Flink, and Go services.” Source: careers page snapshot, Sep 2026.
            </NoteRow>
            <NoteRow stagger icon="review" label="Soft-Bypass option" iconClass="text-honey-deep dark:text-honey">
              Includes a polite offer to route through the official careers portal, removing recruiter protocol pushback.
            </NoteRow>
            <NoteRow stagger icon="privacy" label="Uncertainty" iconClass="text-warning">
              No public evidence the team is hiring right now, so the draft does not claim it.
            </NoteRow>
          </ul>
        </PreviewPanel>
      </div>

      <div className="mt-8" data-motion="reveal">
        <QuietLink href="/sign-up">Try agentic drafting</QuietLink>
      </div>
    </SectionShell>
  );
}
