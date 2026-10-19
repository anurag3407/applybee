import { SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §7 — three writing modes. Peers in how much ReachBee prepares, not in what
 * it is allowed to say, so the columns stay equal and the cost line stays honest.
 */
export function WritingModes({ standalone = false }: { standalone?: boolean }) {
  const modes: Array<{ icon: FeatureIconName; key: string; body: string; cost: string; note: string }> = [
    {
      icon: "manual",
      key: "Manual",
      body: "Write from scratch or from your personal templates with deterministic placeholders. Template use never calls AI.",
      cost: "Free",
      note: "No AI credits used",
    },
    {
      icon: "quick",
      key: "Quick AI",
      body: "Give the intent, the recipient, and an optional job description. A validated, editable draft appears with its supporting facts and optional soft-bypass.",
      cost: "1 credit",
      note: "Per generation",
    },
    {
      icon: "agentic",
      key: "Agentic",
      body: "A bounded preparation pass selects proof points, checks approved company context, and explains its reasoning in evidence rather than a black box.",
      cost: "1 credit",
      note: "Capped budget",
    },
  ];

  return (
    <SectionShell
      id="how-it-works"
      index={standalone ? undefined : "06"}
      eyebrow="Three ways to write"
      heading="Write it yourself. Get a quick start. Or go deeper."
      lede="Switching modes never destroys your text. Manual editing is always free. AI is optional, and one validated generation costs exactly one credit."
    >
      <div className="grid border-t border-border-decorative md:grid-cols-3" data-motion="stagger">
        {modes.map((m) => (
          <article
            key={m.key}
            data-motion="stagger-item"
            className="group flex flex-col border-b border-border-decorative py-7 md:border-b-0 md:border-r md:px-8 md:py-9 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
          >
            <FeatureIcon
              name={m.icon}
              size={20}
              className="text-honey-deep transition-colors duration-200 group-hover:text-ink dark:text-honey"
            />
            <h3 className="mt-5 text-[1.375rem] font-bold tracking-[-0.03em] text-ink">{m.key}</h3>
            <p className="mt-3 flex-1 text-[0.875rem] leading-[1.75] text-text-secondary">{m.body}</p>
            <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-border-decorative pt-4">
              <span className="tabular text-[0.9375rem] font-bold text-ink">{m.cost}</span>
              <span className="text-[0.6875rem] font-medium text-text-disabled">{m.note}</span>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
