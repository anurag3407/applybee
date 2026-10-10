import type { Metadata } from "next";
import Link from "next/link";
import { FAQ, FAQS } from "@/components/marketing/landing";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/faq");

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <JsonLd data={[faqSchema(FAQS), breadcrumbSchema(breadcrumbTrail("FAQ", "/faq"))]} />
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Frequently asked questions</h1>
      <p className="prose-measure mt-3 text-lg text-text-secondary">
        Straight answers. If something isn’t here, the <Link href="/help" className="font-semibold text-ink underline">help center</Link> or{" "}
        <Link href="/contact" className="font-semibold text-ink underline">contact page</Link> can help.
      </p>
      <div className="mt-10">
        <FAQ />
      </div>
    </div>
  );
}
