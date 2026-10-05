import type { Metadata } from "next";
import Link from "next/link";
import { AgenticWorkflow, WritingModes, DirectoryFeature, ResumeIntelligence } from "@/components/marketing/landing";
import { Button } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "How it works · ReachBee AI" };

export default function HowItWorksPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">How it works</h1>
        <p className="prose-measure mt-3 text-lg text-text-secondary">
          Three writing modes, one review step that is always yours. Nothing is sent for you — Gmail draft creation is
          the last automated step, and it only happens after you approve the exact content.
        </p>
        <div className="mt-8">
          <Link href="/sign-up"><Button variant="accent">Start free</Button></Link>
        </div>
      </div>
      <WritingModes />
      <DirectoryFeature />
      <ResumeIntelligence />
      <AgenticWorkflow />
      <div className="border-t border-border-decorative bg-canvas">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="text-3xl font-bold text-ink">The Gmail step, precisely</h2>
          <ol className="prose-measure mt-4 list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-text-secondary">
            <li>You open the approval panel — it shows the recipient, mailbox, subject/body, and attachment, and says “Nothing will be sent.”</li>
            <li>Approving locks that exact version into an immutable delivery record.</li>
            <li>A background task creates the draft in your Gmail. If the result is uncertain, we reconcile; we never blindly recreate.</li>
            <li>ReachBee enforces a 10 drafts/day Deliverability Shield to safeguard your personal sender score and prevent spam traps.</li>
            <li>You see “Created in Gmail. Nothing has been sent.” and you send it yourself.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
