import type { Metadata } from "next";
import { FAQ, FAQS } from "@/components/marketing/landing";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/faq");

export default function FaqPage() {
  return (
    <div>
      <JsonLd data={[faqSchema(FAQS), breadcrumbSchema(breadcrumbTrail("FAQ", "/faq"))]} />
      <FAQ standalone />
    </div>
  );
}
