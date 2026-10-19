import type { Metadata } from "next";
import Link from "next/link";
import { Pricing } from "@/components/marketing/landing";
import { getMarketingCatalog } from "@/server/services/catalog";
import { HELP_ARTICLES } from "@/content/help";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo-schema";
import { MARKETING_PAGES, breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/pricing");

export const revalidate = 300;

export default async function PricingPage() {
  const catalog = await getMarketingCatalog();
  const payments = HELP_ARTICLES.find((a) => a.slug === "refunds");
  const page = MARKETING_PAGES.find((p) => p.path === "/pricing");
  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Pricing", "/pricing"))} />
      {catalog && page ? (
        <JsonLd
          data={softwareApplicationSchema({
            path: "/pricing",
            description: page.description,
            skus: catalog.skus,
          })}
        />
      ) : null}
      <Pricing catalog={catalog} standalone />
      <section aria-labelledby="payment-policies" className="border-b border-border-decorative bg-canvas">
        <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-12 lg:gap-20">
            <h2 id="payment-policies" className="text-[0.8125rem] font-semibold text-ink">
              Payments and refunds
            </h2>
            <div>
              <p className="max-w-[62ch] text-[0.9375rem] leading-[1.75] text-text-secondary">
                {payments
                  ? payments.body[1]
                  : "Credits appear when your payment is confirmed. If confirmation is delayed, do not pay again."}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] font-semibold text-ink">
                <Link
                  href="/legal/refunds"
                  className="underline decoration-border-control/70 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Refund policy
                </Link>
                <Link
                  href="/legal/terms"
                  className="underline decoration-border-control/70 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Terms
                </Link>
                <Link
                  href="/help/refunds"
                  className="underline decoration-border-control/70 underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Payments help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
