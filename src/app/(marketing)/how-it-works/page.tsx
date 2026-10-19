import type { Metadata } from "next";
import Link from "next/link";
import { AgenticWorkflow, WritingModes, DirectoryFeature, ResumeIntelligence } from "@/components/marketing/landing";
import { PageMasthead } from "@/components/marketing/page-masthead";
import { SectionShell } from "@/components/marketing/sections/shell";
import { Button } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/how-it-works");

const gmailSteps = [
  "You open the approval panel: it shows the recipient, mailbox, subject/body, and attachment, and says “Nothing will be sent.”",
  "Approving locks that exact version into an immutable delivery record.",
  "A background task creates the draft in your Gmail. If the result is uncertain, we reconcile; we never blindly recreate.",
  "ReachBee enforces a 10 drafts/day Deliverability Shield to safeguard your personal sender score and prevent spam traps.",
  "You see “Created in Gmail. Nothing has been sent.” and you send it yourself.",
];

export default function HowItWorksPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("How it works", "/how-it-works"))} />
      <PageMasthead
        eyebrow="Product"
        title="How it works"
        lede="Three writing modes, one review step that is always yours. Nothing is sent for you. Gmail draft creation is the last automated step, and it only happens after you approve the exact content."
      >
        <div className="border-t border-border-decorative pt-6">
          <Link href="/sign-up">
            <Button variant="accent">Start free</Button>
          </Link>
        </div>
      </PageMasthead>
      <WritingModes standalone />
      <DirectoryFeature standalone />
      <ResumeIntelligence standalone />
      <AgenticWorkflow standalone />
      <SectionShell
        tone="surface"
        align="stack"
        eyebrow="The last automated step"
        heading="The Gmail step, precisely."
      >
        <ol className="max-w-[64ch] border-t border-border-decorative">
          {gmailSteps.map((step, index) => (
            <li
              key={step}
              className="flex gap-5 border-b border-border-decorative py-4 md:gap-8"
            >
              <span className="tabular shrink-0 pt-0.5 text-[0.6875rem] font-semibold text-text-disabled">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[0.875rem] leading-[1.7] text-text-secondary">{step}</p>
            </li>
          ))}
        </ol>
      </SectionShell>
    </div>
  );
}
