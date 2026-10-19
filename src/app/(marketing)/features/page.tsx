import type { Metadata } from "next";
import Link from "next/link";
import { ProductFacts, DirectoryFeature, WorkspaceTeaser, Trust } from "@/components/marketing/landing";
import { PageMasthead } from "@/components/marketing/page-masthead";
import { Button } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/features");

const deepLinks = [
  { href: "/#directory", label: "Directory" },
  { href: "/#resume", label: "Resume grounding" },
  { href: "/#how-it-works", label: "Three modes" },
  { href: "/#workspace", label: "Pipeline" },
  { href: "/#trust", label: "Trust" },
];

export default function FeaturesPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Features", "/features"))} />
      <PageMasthead
        eyebrow="Product"
        title="Features"
        lede="Directory, profile, three writing modes, pipeline, and trust. Deep links into the full walkthrough."
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border-decorative pt-6">
          <Link href="/sign-up">
            <Button variant="accent">Start free</Button>
          </Link>
          <nav aria-label="Feature deep links" className="flex flex-wrap gap-x-6 gap-y-2">
            {deepLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8125rem] font-semibold text-text-secondary transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </PageMasthead>
      <ProductFacts standalone />
      <DirectoryFeature standalone />
      <WorkspaceTeaser standalone />
      <Trust standalone />
    </div>
  );
}
