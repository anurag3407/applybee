import { Badge } from "@/components/ui/primitives";
import { SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { cn } from "@/lib/cn";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §7 — three writing modes. The modes differ in how much ReachBee prepares,
 * not in what it is allowed to say, so the cards share one glyph style and the
 * chips carry the cost honestly: manual spends nothing.
 */
export function WritingModes() {
  const modes: Array<{ icon: FeatureIconName; key: string; body: string; chip: string; tone: "success" | "honey"; highlight: boolean }> = [
    {
      icon: "manual",
      key: "Manual",
      body: "Write from scratch or from your personal templates with deterministic placeholders. Template use never calls AI.",
      chip: "No AI credits used",
      tone: "success" as const,
      highlight: false,
    },
    {
      icon: "quick",
      key: "Quick AI",
      body: "Give the intent, the recipient, and an optional job description. A validated, editable draft appears with its supporting facts and optional soft-bypass.",
      chip: "1 AI credit per generation",
      tone: "honey" as const,
      highlight: true,
    },
    {
      icon: "agentic",
      key: "Agentic",
      body: "A bounded preparation pass selects proof points, checks approved company context, and explains its reasoning in evidence rather than a black box.",
      chip: "1 AI credit · capped budget",
      tone: "honey" as const,
      highlight: false,
    },
  ];

  return (
    <SectionShell
      id="how-it-works"
      eyebrow="Three ways to write"
      heading="Write it yourself. Get a quick start. Or go deeper."
      lede="Switching modes never destroys your text. Manual editing is always free. AI is optional, and one validated generation costs exactly one credit."
    >
      <div className="grid gap-5 md:grid-cols-3" data-motion="stagger">
        {modes.map((m) => (
          <article
            key={m.key}
            data-motion="stagger-item"
            className={cn(
              "group ab-sheen relative overflow-hidden rounded-card border bg-surface p-6",
              "transition-[transform,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              "hover:-translate-y-0.5 hover:shadow-float",
              m.highlight ? "border-honey shadow-card" : "border-border-decorative shadow-card hover:border-ink/25",
            )}
          >
            <div className="flex items-center gap-4">
              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center">
                <svg viewBox="0 0 48 48" aria-hidden className="absolute inset-0 h-full w-full">
                  <path
                    d="M24 2.4l19.4 11.2v22.4L24 47.2 4.6 35.6V13.6z"
                    className={cn(
                      "transition-[fill,stroke] duration-[220ms]",
                      "fill-honey-wash stroke-honey/45 group-hover:fill-honey group-hover:stroke-honey",
                    )}
                    strokeWidth="1.1"
                  />
                </svg>
                <FeatureIcon name={m.icon} size={22} className="relative text-honey-deep dark:text-honey" />
              </span>
              <h3 className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink">{m.key}</h3>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-text-secondary">{m.body}</p>

            <div className="mt-5 border-t border-border-decorative pt-4">
              <Badge tone={m.tone}>{m.chip}</Badge>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
