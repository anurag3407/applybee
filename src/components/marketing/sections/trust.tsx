import Link from "next/link";
import { SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import type { FeatureIconName } from "@/components/marketing/feature-icon";

/**
 * §9 — trust. The Gmail permission quote comes first and verbatim, because the
 * permission technically allows sending and the page should say so before
 * anything else on it.
 */
export function Trust({ standalone = false }: { standalone?: boolean }) {
  const principles: Array<{ icon: FeatureIconName; title: string; body: string }> = [
    {
      icon: "gmail",
      title: "Explicit Gmail connection",
      body: "Connecting Gmail is optional and separate from signing in. You choose when, and you can disconnect any time.",
    },
    {
      icon: "cap",
      title: "Deliverability Shield",
      body: "Capped at 10 drafts a day to protect your personal Gmail domain reputation, avoid Google spam triggers, and keep open rates high.",
    },
    {
      icon: "privacy",
      title: "Private résumés",
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
      index={standalone ? undefined : "08"}
      eyebrow="Trust and permissions"
      heading="Your review. Your account. Your decision."
      lede="We state the Gmail permission plainly because it is broader than how we use it, and you should be able to check that claim against the code, not just a policy page."
    >
      <figure
        className="brand-panel on-ink relative overflow-hidden rounded-scene bg-ink px-7 py-9 text-surface md:px-12 md:py-12"
        data-motion="reveal"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-honey/40" />
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-surface/50">
          The Gmail permission, plainly
        </p>
        <blockquote className="mt-6 max-w-[40ch] font-editorial text-[1.5rem] font-medium leading-[1.4] tracking-[-0.01em] text-surface md:text-[2rem]">
          “Google’s permission allows managing drafts and sending email. ReachBee uses this connection to create drafts
          you approve. We do not send email automatically or read your inbox. You can disconnect at any time.”
        </blockquote>
        <figcaption className="mt-7 max-w-[62ch] border-t border-surface/15 pt-5 text-[0.8125rem] leading-relaxed text-surface/65">
          We say this plainly because the permission technically permits sending; our product and code do not. Nothing
          leaves your account without your explicit review.
        </figcaption>
      </figure>

      <div className="mt-10 grid gap-x-14 sm:grid-cols-2" data-motion="stagger">
        {principles.map((p, i) => (
          <div
            key={p.title}
            data-motion="stagger-item"
            className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 border-t border-border-decorative py-6"
          >
            <FeatureIcon name={p.icon} size={18} className="mt-0.5 text-honey-deep dark:text-honey" />
            <div>
              <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">
                {p.title}
                <span className="tabular ml-2 text-[0.6875rem] font-semibold text-text-disabled">0{i + 1}</span>
              </h3>
              <p className="mt-2 text-[0.875rem] leading-[1.7] text-text-secondary">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 border-t border-border-decorative pt-6 text-[0.8125rem] text-text-secondary" data-motion="reveal">
        Read the{" "}
        <Link href="/legal/privacy" className="font-semibold text-ink underline decoration-border-control underline-offset-4">
          privacy policy
        </Link>
        , the{" "}
        <Link href="/legal/contact-data" className="font-semibold text-ink underline decoration-border-control underline-offset-4">
          contact-data policy
        </Link>{" "}
        and our{" "}
        <Link href="/security" className="font-semibold text-ink underline decoration-border-control underline-offset-4">
          security notes
        </Link>
        .
      </p>
    </SectionShell>
  );
}
