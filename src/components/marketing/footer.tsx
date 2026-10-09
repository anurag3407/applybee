import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { CombField } from "@/components/svg/meter";

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
    <footer className="relative overflow-hidden border-t border-border-decorative bg-surface">
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 pb-24 pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div>
            <Wordmark />
            <p className="prose-measure mt-4 max-w-[34ch] text-sm leading-relaxed text-text-secondary">
              Grounded outreach drafts, staged in your own Gmail. Nothing leaves without you pressing send.
            </p>
            <Link href="/sign-up" className="mt-5 inline-block text-sm font-bold text-ink underline underline-offset-4">
              Create a free account
            </Link>
          </div>

          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.label}>
                <h2 className="text-sm font-bold text-ink">{col.label}</h2>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="ab-slide inline-flex text-sm text-text-secondary hover:text-ink"
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

        <p className="mt-14 max-w-[70ch] border-t border-border-decorative pt-6 text-xs leading-relaxed text-text-disabled">
          Reveal credits unlock a directory email once. A verification label means a provider checked that the mailbox
          existed at check time. It does not mean a role is open, that anyone expects your message, or that delivery is
          guaranteed. ReachBee does not send email on your behalf.
        </p>
        <p className="mt-4 text-xs text-text-disabled">
          © {new Date().getFullYear()} ReachBee AI. Prices shown in INR where a catalog is available.
        </p>
      </div>

      <CombField
        rows={2}
        cols={22}
        opacity={0.22}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full [mask-image:linear-gradient(to_top,#000,transparent)]"
      />
    </footer>
  );
}

export default MarketingFooter;
