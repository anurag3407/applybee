import type { Metadata } from "next";
import { ProductFacts, Problem, DirectoryFeature, ResumeIntelligence, AgenticWorkflow, WritingModes, WorkspaceTeaser, Trust, Pricing, FAQ, FinalCta } from "@/components/marketing/landing";
import { FeatureGridDark } from "@/components/marketing/feature-grid-dark";
import { HeroSection, BrandSlider, defaultAvatarList, defaultBrandList } from "@/components/ui/hero-01";
import Features2 from "@/components/ui/features-2";
import Bento2 from "@/components/ui/bento2";
import Testimonials1 from "@/components/ui/testimonials";
import Newsletter1 from "@/components/ui/newsletter";
import { getMarketingCatalog, getTrialAllowance } from "@/server/services/catalog";

export const metadata: Metadata = {
  title: "ReachBee AI — Direct Outreach Beyond Saturated Job Portals",
  description:
    "The career outreach workspace where you stay in control of every draft. Ground your real achievements into bespoke cold introductions and stage drafts directly into your Gmail.",
};

export const revalidate = 300;

export default async function HomePage() {
  const [catalog, trial] = await Promise.all([getMarketingCatalog(), getTrialAllowance()]);
  return (
    <>
      <HeroSection avatarList={defaultAvatarList} trial={trial} />
      <BrandSlider brandList={defaultBrandList} />
      <FeatureGridDark />
      <Features2 />
      <ProductFacts />
      <Problem />
      <DirectoryFeature />
      <Bento2 />
      <ResumeIntelligence />
      <AgenticWorkflow />
      <WritingModes />
      <WorkspaceTeaser />
      <Trust />
      <Testimonials1 />
      <Pricing catalog={catalog} />
      <FAQ />
      <section className="py-12 px-4">
        <Newsletter1
          heading="Join ReachBee To Stay Ahead"
          subheading="Get career outreach strategies, hiring manager insights, and AI workflow tips delivered weekly."
          placeholder="Enter your email"
          buttonText="Subscribe"
          disclaimer="Your privacy matters. We safeguard your information for a secure and confidential experience."
        />
      </section>
      <FinalCta trial={trial} />
    </>
  );
}
