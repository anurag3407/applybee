import { SectionShell } from "@/components/marketing/sections/shell";

/**
 * §11 — FAQ. Exported so /faq and the home page emit FAQPage markup from the
 * same text they render. Answers are plain strings so the JSON-LD stays a
 * faithful copy.
 */
export const FAQS: Array<{ q: string; a: string }> = [
  { q: "Does ReachBee send emails for me?", a: "No. ReachBee prepares drafts. You review, edit, and send them yourself, or copy the text anywhere." },
  { q: "Why is there a daily limit of 10 AI drafts?", a: "To protect your personal Gmail domain reputation. Sending dozens of cold emails triggers Google's automated abuse filters and burns your personal address. A 10/day limit enforces quality and keeps your outreach landing directly in the recipient's primary inbox." },
  { q: "Won't recruiters get upset if I reach out to engineering managers directly?", a: "ReachBee supports a 'Soft-Bypass' protocol. Drafts focus strictly on technical stack alignment and can include a courteous closing line offering to route through their official careers portal if preferred. This transforms outreach from an aggressive bypass into a professional peer introduction." },
  { q: "What exactly does the Gmail permission allow?", a: "Google’s gmail.compose permission allows managing drafts and sending email. ReachBee uses it only to create drafts you approved. We don’t read your inbox or send mail automatically." },
  { q: "Can I use it without connecting Gmail?", a: "Yes. Manual writing, quick AI, templates, copy/export, and the pipeline all work without Gmail. Connecting is only for creating drafts in your mailbox." },
  { q: "Can I draft manually for free?", a: "Yes. The manual editor, templates, saving, and copying use no AI credits and require no purchase beyond browsing/reveals." },
  { q: "When is a credit consumed?", a: "A reveal credit when a directory email is unlocked the first time. An AI credit when a validated draft is saved to your account, not when generation starts and not when Gmail succeeds." },
  { q: "Do repeated email reveals cost again?", a: "No. Once you reveal a contact, reopening or copying that email is always free." },
  { q: "What does “verified” mean?", a: "A verification provider checked the address recently. It means the mailbox existed at check time, not that the person is hiring, expects outreach, or that delivery is guaranteed." },
  { q: "What happens when AI or Gmail fails?", a: "If generation fails, your AI credit is released automatically. If Gmail fails, your draft stays saved here and you can retry, reconcile, or copy the text." },
  { q: "Are these subscriptions?", a: "No. Packs are one-time purchases. No auto-renewal, no cancellation dates." },
  { q: "Do credits expire, and how do refunds work?", a: "Paid credits don’t expire during ordinary service. Unused purchased allowance is refundable under our published refunds policy." },
  { q: "Can I delete my resume and profile?", a: "Yes: delete files or the whole account from settings. Deleting app content doesn’t remove copies you already created in Gmail." },
  { q: "Will this guarantee interviews or a job?", a: "No. Nothing can. ReachBee helps you prepare relevant, truthful introductions. Outcomes depend on you and the market." },
];

export function FAQ({ standalone = false }: { standalone?: boolean }) {
  return (
    <SectionShell
      id={standalone ? undefined : "faq"}
      index={standalone ? undefined : "06"}
      eyebrow="Questions"
      align="split"
      headingAs={standalone ? "h1" : "h2"}
      headingClass={standalone ? "text-[clamp(2.5rem,5vw,4.25rem)] max-w-[24ch]" : undefined}
      heading="Questions people actually ask."
      lede="Fourteen of them, answered the way we would answer them in person, including the ones where the answer is no."
    >
      <div className="grid gap-x-14 md:grid-cols-2" data-motion="stagger">
        {FAQS.map((f) => (
          <details
            key={f.q}
            data-motion="stagger-item"
            className="group border-t border-border-decorative py-5 md:[&:nth-child(-n+2)]:border-t-0 md:[&:nth-child(-n+2)]:pt-0"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-[0.9375rem] font-semibold leading-snug text-ink marker:hidden">
              {f.q}
              <span
                aria-hidden
                className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-text-secondary transition-transform duration-200 group-open:rotate-45 group-open:text-honey-deep dark:group-open:text-honey"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 max-w-[52ch] text-[0.875rem] leading-[1.7] text-text-secondary">{f.a}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
