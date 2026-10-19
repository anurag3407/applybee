import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";

/**
 * Three real destinations per column, every one verified against a route that
 * exists. The comb band at the bottom edge is the brand motif; it carries no
 * claim, so it stays low-contrast and behind the rule line.
 */

const columns = [
  {
    label: "Product",
    links: [
      { href: "/how-it-works", text: "How it works" },
      { href: "/features", text: "Features" },
      { href: "/pricing", text: "Pricing" },
      { href: "/faq", text: "FAQ" },
    ],
  },
  {
    label: "Trust",
    links: [
      { href: "/security", text: "Security" },
      { href: "/legal/privacy", text: "Privacy policy" },
      { href: "/legal/terms", text: "Terms of service" },
      { href: "/accessibility", text: "Accessibility" },
    ],
  },
  {
    label: "Your data",
    links: [
      { href: "/contact-data/request", text: "Request removal or correction" },
      { href: "/contact", text: "Contact us" },
      { href: "/help", text: "Help and docs" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-decorative bg-surface">
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-[32ch] text-[0.9375rem] leading-relaxed text-text-secondary">
              Grounded outreach drafts, staged in your own Gmail. Nothing leaves without you pressing send.
            </p>
            <Link
              href="/sign-up"
              className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-ink underline decoration-border-control underline-offset-4 hover:decoration-ink"
            >
              Create a free account
            </Link>
          </div>

          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.label}>
                <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-disabled">{col.label}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[0.875rem] text-text-secondary transition-colors hover:text-ink"
                      >
                        {l.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-border-decorative pt-6 md:flex-row md:items-start md:justify-between">
          <p className="max-w-[70ch] text-[0.6875rem] leading-relaxed text-text-disabled">
            Reveal credits unlock a directory email once. A verification label means a provider checked that the mailbox
            existed at check time. It does not mean a role is open, that anyone expects your message, or that delivery is
            guaranteed. ReachBee does not send email on your behalf.
          </p>
          <p className="shrink-0 text-[0.6875rem] text-text-disabled">
            © {new Date().getFullYear()} ReachBee AI
          </p>
        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;
