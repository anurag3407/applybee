import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { HeroScene } from "@/components/marketing/hero-scene";
import { FeatureIcon } from "@/components/marketing/feature-icon";

export function Hero({ trial }: { trial: { contact: number; ai: number } | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border-decorative">
      <div className="mx-auto grid max-w-[calc(var(--ab-container-marketing))] items-center gap-14 px-5 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-20 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.08fr)] lg:gap-20 lg:px-8">
        <div className="min-w-0 lg:py-6">
          <p className="flex items-center gap-3 text-[0.8125rem] font-semibold text-text-secondary" data-motion="reveal">
            <span aria-hidden className="h-1.5 w-1.5 bg-honey" />
            The career outreach workspace
          </p>

          <h1
            className="mt-7 max-w-[13ch] font-extrabold leading-[0.98] tracking-[-0.05em] text-ink"
            style={{ fontSize: "clamp(2.9rem, 5.4vw, 4.5rem)" }}
            data-motion="reveal"
          >
            Reach the person, not the portal.
          </h1>

          <p className="mt-7 max-w-[48ch] text-[1.0625rem] leading-[1.7] text-text-secondary" data-motion="reveal">
            Find engineering decision-makers. Ground every introduction in achievements you have confirmed. Review the
            draft in your own Gmail before anything leaves your hands.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3" data-motion="reveal">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="px-6">
                Start free, no card
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="px-6">
                See how it works
              </Button>
            </Link>
          </div>

          {trial ? (
            <dl
              className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border-decorative pt-6"
              data-motion="reveal"
            >
              {[
                { k: "Contact reveals", v: trial.contact },
                { k: "AI generations", v: trial.ai },
                { k: "Manual drafting", v: "Free" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-[0.75rem] font-medium leading-snug text-text-secondary">{s.k}</dt>
                  <dd className="tabular mt-1.5 text-[1.375rem] font-extrabold tracking-[-0.03em] text-ink">{s.v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="relative min-w-0 lg:pl-4">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}

export function GuaranteeBand() {
  const items = [
    {
      icon: "review" as const,
      title: "You press send",
      body: "ReachBee writes drafts. It never sends one, and it never reads your inbox.",
    },
    {
      icon: "grounding" as const,
      title: "Nothing invented",
      body: "If a number is not in your resume, the draft has no number.",
    },
    {
      icon: "cap" as const,
      title: "Ten drafts a day, by design",
      body: "A ceiling that protects your personal Gmail reputation, not a limit on your work.",
    },
  ];
  return (
    <section className="border-b border-border-decorative bg-surface">
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 sm:px-6 lg:px-8">
        <dl className="grid divide-y divide-border-decorative md:grid-cols-3 md:divide-x md:divide-y-0" data-motion="stagger">
          {items.map((i) => (
            <div key={i.title} data-motion="stagger-item" className="flex items-start gap-4 py-7 md:px-8 md:first:pl-0 md:last:pr-0">
              <FeatureIcon name={i.icon} size={19} className="mt-0.5 shrink-0 text-honey-deep dark:text-honey" />
              <div>
                <dt className="text-[0.9375rem] font-bold text-ink">{i.title}</dt>
                <dd className="mt-1 text-[0.875rem] leading-relaxed text-text-secondary">{i.body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
