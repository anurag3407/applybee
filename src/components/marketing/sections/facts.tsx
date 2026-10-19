import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { SectionShell } from "@/components/marketing/sections/shell";

/**
 * §2 — the feature set. Four statements on ruled paper, sized to be read,
 * not skimmed as equal cards.
 */
export function ProductFacts({ standalone = false }: { standalone?: boolean }) {
  const facts: Array<{ title: string; body: string; meta?: React.ReactNode }> = [
    {
      title: "Verified decision-makers",
      body: "A direct directory of Engineering Managers, Tech Leads, and Founders, with source freshness and verification labels shown plainly, never implied.",
    },
    {
      title: "Grounding Engine",
      body: "AI drafts are written only from details you have confirmed. If a metric is not in your resume, we never invent one.",
      meta: <Badge tone="success">Zero hallucination</Badge>,
    },
    {
      title: "Deliverability Shield",
      body: "Capped at 10 drafts a day by design to protect your personal Gmail domain reputation, avoid spam traps, and keep replies coming.",
      meta: <Badge tone="warning">10 / day ceiling</Badge>,
    },
    {
      title: "You review before sending",
      body: "Drafts land in your own Gmail. You edit, approve, and press send yourself. Nothing leaves without your eyes on it.",
      meta: <Badge tone="info">Draft-only access</Badge>,
    },
  ];

  return (
    <SectionShell
      tone="surface"
      id="features"
      index={standalone ? undefined : "01"}
      eyebrow="What ReachBee does"
      heading="Four things it does, and one it deliberately does not."
      lede="No auto-applying, no inbox scraping, no guessed numbers. The product is narrow on purpose: it makes one message better, and leaves the send button with you."
    >
      <div className="grid gap-x-14 gap-y-0 sm:grid-cols-2" data-motion="stagger">
        {facts.map((f, i) => (
          <div
            key={f.title}
            data-motion="stagger-item"
            className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 border-t border-border-decorative py-7 sm:[&:nth-child(-n+2)]:border-t-0"
          >
            <span className="tabular pt-0.5 text-[0.6875rem] font-semibold text-text-disabled">
              0{i + 1}
            </span>
            <div>
              <h3 className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">{f.title}</h3>
              <p className="mt-2 max-w-[46ch] text-[0.875rem] leading-[1.7] text-text-secondary">{f.body}</p>
              {f.meta ? <div className="mt-3.5">{f.meta}</div> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border-decorative pt-6" data-motion="reveal">
        <p className="text-[0.8125rem] text-text-secondary">
          Understand our data and permissions in the{" "}
          <Link href="/legal/contact-data" className="font-semibold text-ink underline decoration-border-control underline-offset-4">
            contact-data policy
          </Link>{" "}
          and the{" "}
          <Link href="/security" className="font-semibold text-ink underline decoration-border-control underline-offset-4">
            security page
          </Link>
          .
        </p>
      </div>
    </SectionShell>
  );
}
