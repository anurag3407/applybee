import type { Metadata } from "next";
import Link from "next/link";
import { ProductFacts, DirectoryFeature, WorkspaceTeaser, Trust } from "@/components/marketing/landing";
import { Button } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Features · ReachBee AI" };

export default function FeaturesPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Features</h1>
        <p className="prose-measure mt-3 text-lg text-text-secondary">
          Directory, profile, three writing modes, pipeline, and trust — deep links into the full walkthrough below.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li><Link href="/#directory" className="font-semibold text-ink underline">Directory</Link></li>
          <li><Link href="/#resume" className="font-semibold text-ink underline">Resume grounding</Link></li>
          <li><Link href="/#how-it-works" className="font-semibold text-ink underline">Three modes</Link></li>
          <li><Link href="/#workspace" className="font-semibold text-ink underline">Pipeline</Link></li>
          <li><Link href="/#trust" className="font-semibold text-ink underline">Trust</Link></li>
        </ul>
        <div className="mt-8">
          <Link href="/sign-up"><Button variant="accent">Start free</Button></Link>
        </div>
      </div>
      <ProductFacts />
      <DirectoryFeature />
      <WorkspaceTeaser />
      <Trust />
    </div>
  );
}
