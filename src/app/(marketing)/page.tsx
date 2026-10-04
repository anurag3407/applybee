import type { Metadata } from "next";
import { Hero, ProductFacts, Problem, DirectoryFeature, ResumeIntelligence, AgenticWorkflow, WritingModes, WorkspaceTeaser, Trust, Pricing, FAQ, FinalCta } from "@/components/marketing/landing";
import { getMarketingCatalog, getTrialAllowance } from "@/server/services/catalog";

export const metadata: Metadata = {
  title: "Apply Bee — Get your work in front of the right people",
  description:
    "Find relevant hiring contacts, write a truthful, well-grounded introduction, and prepare a Gmail draft you review. You send it yourself.",
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
