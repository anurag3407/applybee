import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { FeatureCard, SectionShell } from "@/components/marketing/sections/shell";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §2 — the feature grid. Four facts, each with its own hex plate and glyph, so
 * the page's core claims are scannable before a single sentence is read.
 * Also rendered on /features, so it carries no hero-only context.
 */
export function ProductFacts() {
  const facts: Array<{ icon: FeatureIconName; title: string; body: string; meta?: React.ReactNode }> = [
    {
      icon: "directory",
      title: "Verified decision-makers",
      body: "A direct directory of Engineering Managers, Tech Leads, and Founders — with source freshness and verification labels shown plainly, never implied.",
    },
    {
      icon: "grounding",
      title: "Grounding Engine",
      body: "AI drafts are written only from details you have confirmed. If a metric isn’t in your resume, we never invent one.",
      meta: <Badge tone="success">Zero hallucination</Badge>,
    },
    {
      icon: "cap",
      title: "Deliverability Shield",
      body: "Capped at 10 drafts/day by design to protect your personal Gmail domain reputation, avoid spam traps, and maximise open rates.",
      meta: <Badge tone="warning">10 / day ceiling</Badge>,
    },
    {
      icon: "review",
      title: "You review before sending",
      body: "Drafts land in your own Gmail. You edit, approve, and press send yourself. Nothing leaves without your eyes on it.",
      meta: <Badge tone="info">Draft-only access</Badge>,
    },
  ];

  return (
    <SectionShell
      tone="surface"
      id="features"
      eyebrow="What ReachBee does"
      heading="Four things it does, and one it deliberately doesn’t."
      lede="No auto-applying, no inbox scraping, no guessed numbers. The product is narrow on purpose — it makes one message better, and leaves the send button with you."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-motion="stagger">
        {facts.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3" data-motion="reveal">
        <p className="text-sm text-text-secondary">
          Understand our data and permissions in the{" "}
          <Link href="/legal/contact-data" className="font-semibold text-ink underline underline-offset-4">
            contact-data policy
          </Link>{" "}
          and the{" "}
          <Link href="/security" className="font-semibold text-ink underline underline-offset-4">
            security page
          </Link>
          .
        </p>
      </div>
    </SectionShell>
  );
}
