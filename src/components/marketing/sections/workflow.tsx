import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { NoteRow, PreviewPanel, SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §6 — the agentic flow. Three steps because that is the real product flow:
 * pick context, prepare from evidence, review. Not a template count.
 *
 * The evidence panel is the section's proof: it shows what the preparation pass
 * actually selected, including the row where there was nothing to select.
 */
export function AgenticWorkflow() {
  const steps: Array<{ icon: FeatureIconName; title: string; body: string }> = [
    {
      icon: "manual",
      title: "Choose your context",
      body: "Pick the intent — advertised role, internship, referral, or speculative intro — and paste a job description or role notes if you have one.",
    },
    {
      icon: "agentic",
      title: "Prepare with evidence",
      body: "A bounded preparation step selects relevant confirmed facts and approved, dated company context. You see exactly what was used.",
    },
    {
      icon: "review",
      title: "Review with Soft-Bypass",
      body: "The draft arrives with its evidence references and an optional closing line offering to route through the official careers portal, to remove recruiter friction.",
    },
  ];

  return (
    <SectionShell
      tone="surface"
      id="agentic"
      eyebrow="Agentic drafting"
      heading="A little preparation. A much better introduction."
      lede="One bounded pass, then you. The preparation step is explainable because every line it used is listed beside the draft it produced."
    >
      <ol className="grid gap-5 md:grid-cols-3" data-motion="stagger">
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-motion="stagger-item"
            className="group ab-sheen relative overflow-hidden rounded-card border border-border-decorative bg-canvas p-6 transition-[border-color,box-shadow] duration-[220ms] hover:border-ink/25 hover:shadow-card"
          >
            {/* Step number rides in the hex plate's corner, not as a separate chip. */}
            <div className="flex items-start justify-between gap-4">
              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center">
                <svg viewBox="0 0 48 48" aria-hidden className="absolute inset-0 h-full w-full">
                  <path
                    d="M24 2.4l19.4 11.2v22.4L24 47.2 4.6 35.6V13.6z"
                    className="fill-honey-wash stroke-honey/45 transition-[fill,stroke] duration-[220ms] group-hover:fill-honey group-hover:stroke-honey"
                    strokeWidth="1.1"
                  />
                </svg>
                <FeatureIcon name={s.icon} size={22} className="relative text-ink" />
              </span>
              <span className="tabular text-3xl font-extrabold leading-none tracking-tight text-border-control/70">
                0{i + 1}
              </span>
            </div>
            <h3 className="mt-5 text-[1.0625rem] font-bold leading-snug text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
          </li>
        ))}
      </ol>

      <PreviewPanel
        className="mt-8"
        label="Evidence panel (example)"
        aside={
          <span className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-honey-deep dark:text-honey">
            <FeatureIcon name="agentic" size={13} />
            Bounded · one pass
          </span>
        }
      >
        <ul className="grid gap-3 md:grid-cols-2" data-motion="stagger">
          <NoteRow stagger icon="grounding" label="Fact #12" iconClass="text-success">
            “Built an events pipeline handling 40k events/min” — confirmed by you.
          </NoteRow>
          <NoteRow stagger icon="cost" label="Company note" iconClass="text-info">
            “Public job posts mention Kafka, Flink, and Go services.” Source: careers page snapshot, Sep 2026.
          </NoteRow>
          <NoteRow stagger icon="review" label="Soft-Bypass option" iconClass="text-honey-deep dark:text-honey">
            Includes a polite offer to route through the official careers portal, removing recruiter protocol pushback.
          </NoteRow>
          <NoteRow stagger icon="privacy" label="Uncertainty" iconClass="text-warning">
            No public evidence the team is hiring right now — so the draft doesn’t claim it.
          </NoteRow>
        </ul>
      </PreviewPanel>

      <div className="mt-8" data-motion="reveal">
        <Link href="/sign-up" className="inline-flex">
          <Button variant="accent" size="lg">
            Try agentic drafting
          </Button>
        </Link>
      </div>
    </SectionShell>
  );
}
