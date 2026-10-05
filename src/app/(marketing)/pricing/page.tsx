import type { Metadata } from "next";
import Link from "next/link";
import { Pricing } from "@/components/marketing/landing";
import { getMarketingCatalog } from "@/server/services/catalog";
import { Badge } from "@/components/ui/primitives";
import { HELP_ARTICLES } from "@/content/help";

export const metadata: Metadata = { title: "Pricing · ReachBee AI" };

export const revalidate = 300;

export default async function PricingPage() {
  const catalog = await getMarketingCatalog();
  const payments = HELP_ARTICLES.find((a) => a.slug === "refunds");
  return (
    <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Pricing</h1>
      <p className="prose-measure mt-3 text-lg text-text-secondary">
        One-time packs, visible costs, no subscriptions. Every action shows its price before you confirm.
      </p>
      <div className="mt-10">
        <Pricing catalog={catalog} />
      </div>
      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <div className="rounded-card border border-border-decorative bg-surface p-6">
          <h2 className="text-xl font-bold text-ink">How credits behave</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li>• Reveal a directory email once — reopen/copy it free, forever.</li>
            <li>• One validated AI draft = one AI credit. Failed generations release automatically.</li>
            <li>• <strong>Deliverability Shield:</strong> Up to 10 AI drafts per day per account (resets at midnight UTC) to protect your personal sender reputation and avoid spam filters.</li>
            <li>• Manual writing, templates, and export are always free.</li>
            <li>• Gmail draft creation is not an AI charge.</li>
          </ul>
        </div>
        <div className="rounded-card border border-border-decorative bg-surface p-6">
          <h2 className="text-xl font-bold text-ink">Policies</h2>
          <p className="mt-3 text-sm text-text-secondary">
            {payments ? payments.body[1] : "Credits appear when your payment is confirmed."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/legal/refunds"><Badge tone="info">Refunds</Badge></Link>
            <Link href="/legal/terms"><Badge tone="info">Terms</Badge></Link>
            <Link href="/help/refunds"><Badge tone="info">Payments help</Badge></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
