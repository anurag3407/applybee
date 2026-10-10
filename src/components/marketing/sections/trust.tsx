import Link from "next/link";
import { FeatureCard, SectionShell } from "@/components/marketing/sections/shell";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §9 — trust. The Gmail permission quote comes first and verbatim, because the
 * permission technically allows sending and the page should say so before
 * anything else on it.
 */
export function Trust() {
  const principles: Array<{ icon: FeatureIconName; title: string; body: string }> = [
    {
      icon: "gmail",
      title: "Explicit Gmail connection",
      body: "Connecting Gmail is optional and separate from signing in. You choose when, and you can disconnect any time.",
    },
    {
      icon: "cap",
      title: "Deliverability Shield",
      body: "Capped at 10 drafts/day to protect your personal Gmail domain reputation, avoid Google spam triggers, and keep open rates high.",
    },
    {
      icon: "privacy",
      title: "Private resumes",
      body: "Your files sit in private storage, scanned and gated. Downloads require your signed-in session. Nothing becomes public.",
    },
    {
      icon: "grounding",
      title: "Truthful AI",
      body: "Drafts cite the facts they use. Unsupported claims are rejected, not dressed up.",
    },
    {
      icon: "cost",
      title: "Visible costs",
      body: "Every action shows its price before you confirm. Balances, reservations, and history are in the open.",
    },
  ];

  return (
    <SectionShell
      id="trust"
      eyebrow="Trust & permissions"
      heading="Your review. Your account. Your decision."
      lede="We state the Gmail permission plainly because it is broader than how we use it — and you should be able to check that claim against the code, not just a policy page."
    >
      <figure className="relative overflow-hidden rounded-scene border border-honey/40 bg-honey-wash/40 p-6 md:p-8" data-motion="reveal">
        <blockquote className="prose-measure text-[1.0625rem] font-medium leading-relaxed text-ink md:text-[1.1875rem]">
          “Google’s permission allows managing drafts and sending email. ReachBee uses this connection to create drafts
          you approve. We do not send email automatically or read your inbox. You can disconnect at any time.”
        </blockquote>
        <figcaption className="mt-4 text-sm text-text-secondary">
          We say this plainly because the permission technically permits sending; our product and code do not. Nothing
          leaves your account without your explicit review.
        </figcaption>
      </figure>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-motion="stagger">
        {principles.map((p) => (
          <FeatureCard key={p.title} {...p} />
        ))}
      </div>

      <p className="mt-8 text-sm text-text-secondary" data-motion="reveal">
        Read the{" "}
        <Link href="/legal/privacy" className="font-semibold text-ink underline underline-offset-4">
          privacy policy
        </Link>
        , the{" "}
        <Link href="/legal/contact-data" className="font-semibold text-ink underline underline-offset-4">
          contact-data policy
        </Link>{" "}
        and our{" "}
        <Link href="/security" className="font-semibold text-ink underline underline-offset-4">
          security notes
        </Link>
        .
      </p>
    </SectionShell>
  );
}
