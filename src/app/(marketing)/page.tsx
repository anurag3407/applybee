import type { Metadata } from "next";
import { Hero, GuaranteeBand, ProductFacts, Problem, DirectoryFeature, ResumeIntelligence, AgenticWorkflow, WritingModes, WorkspaceTeaser, Trust, Pricing, FAQ, FinalCta, FAQS } from "@/components/marketing/landing";
import { NewsletterBand } from "@/components/marketing/newsletter";
import { getMarketingCatalog, getTrialAllowance } from "@/server/services/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { faqSchema, softwareApplicationSchema } from "@/lib/seo-schema";
import { MARKETING_PAGES, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/");

export const revalidate = 300;

export default async function HomePage() {
  const [catalog, trial] = await Promise.all([getMarketingCatalog(), getTrialAllowance()]);
  const page = MARKETING_PAGES.find((p) => p.path === "/");
  return (
    <>
      {catalog && page ? (
        <JsonLd
          data={softwareApplicationSchema({
            path: "/",
            description: page.description,
            skus: catalog.skus,
          })}
        />
      ) : null}
      <JsonLd data={faqSchema(FAQS)} />
      <Hero trial={trial} />
      <GuaranteeBand />
      <ProductFacts />
      <Problem />
      <DirectoryFeature />
      <ResumeIntelligence />
      <AgenticWorkflow />
      <WritingModes />
      <WorkspaceTeaser />
      <Trust />
      <Pricing catalog={catalog} />
      <FAQ />
      <NewsletterBand />
      <FinalCta trial={trial} />
    </>
  );
}
