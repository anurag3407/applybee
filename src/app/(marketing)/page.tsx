import type { Metadata } from "next";
import { Hero, ProductFacts, Problem, DirectoryFeature, ResumeIntelligence, AgenticWorkflow, WritingModes, WorkspaceTeaser, Trust, Pricing, FAQ, FinalCta } from "@/components/marketing/landing";
import { NewsletterBand } from "@/components/marketing/newsletter";
import { getMarketingCatalog, getTrialAllowance } from "@/server/services/catalog";

export const metadata: Metadata = {
  title: "ReachBee AI: Direct Outreach Beyond Saturated Job Portals",
  description:
    "The career outreach workspace where you stay in control of every draft. Ground your real achievements into bespoke cold introductions and stage drafts directly into your Gmail.",
};

export const revalidate = 300;

export default async function HomePage() {
  const [catalog, trial] = await Promise.all([getMarketingCatalog(), getTrialAllowance()]);
  return (
    <>
      <Hero trial={trial} />
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
