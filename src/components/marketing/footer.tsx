import Link from "next/link";
import { Wordmark } from "./brand";

const groups = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/app", label: "Workspace" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help" },
      { href: "/contact", label: "Contact" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/security", label: "Security" },
      { href: "/legal/contact-data", label: "Contact data" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/refunds", label: "Refunds" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
      { href: "/legal/cookies", label: "Cookies" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-decorative bg-surface">
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Wordmark />
            <p className="max-w-xs text-sm text-text-secondary">
              A career outreach workspace. You stay the sender: review, edit, and approve every draft.
            </p>
          </div>
          {groups.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <h2 className="mb-3 text-sm font-bold text-ink">{g.title}</h2>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-text-secondary hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border-decorative pt-6 text-xs text-text-disabled md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ReachBee. Direct outreach beyond saturated job portals.</p>
          <p>
            ReachBee never sends email on your behalf. Gmail draft creation requires your explicit approval. We don’t
            guarantee interviews, replies, or hiring outcomes.
          </p>
        </div>
      </div>
    </footer>
  );
}
