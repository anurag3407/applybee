import { Fraunces } from "next/font/google";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingMotion } from "@/components/marketing/motion";
import { JsonLd } from "@/components/seo/json-ld";
import { siteGraph } from "@/lib/seo-schema";

// Declared here rather than in the root layout: `--font-editorial` (the only
// consumer of this family) is used by marketing copy alone, and from the root
// layout Next preloaded its two weights on every workspace and sign-in page.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`flex min-h-screen flex-col bg-canvas ${fraunces.variable}`}
      style={{ "--font-editorial": "var(--font-fraunces), Georgia, serif" } as React.CSSProperties}
    >
      {/* Nothing in this shell may read the request's session: awaiting it here
          made all twelve marketing routes dynamic, which silenced `revalidate`
          and left every landing hit to be rendered on a Worker. The header
          resolves the signed-in CTA on the client instead. */}
      <MarketingHeader />
      <JsonLd data={siteGraph()} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MarketingMotion />
    </div>
  );
}
