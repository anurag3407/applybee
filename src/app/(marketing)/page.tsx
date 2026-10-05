import type { Metadata } from "next";
import { Hero, ProductFacts, Problem, DirectoryFeature, ResumeIntelligence, AgenticWorkflow, WritingModes, WorkspaceTeaser, Trust, Pricing, FAQ, FinalCta } from "@/components/marketing/landing";
import { getMarketingCatalog, getTrialAllowance } from "@/server/services/catalog";

export const metadata: Metadata = {
  title: "ReachBee AI — Direct Outreach Beyond Saturated Job Portals",
  description:
    "Bypass the 500-applicant portal black hole. Ground your real achievements into bespoke cold introductions and stage drafts directly into your Gmail.",
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
      <FinalCta trial={trial} />
    </>
  );
}
