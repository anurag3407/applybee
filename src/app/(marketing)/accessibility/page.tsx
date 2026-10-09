import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Accessibility</h1>
      <p className="prose-measure mt-3 text-lg text-text-secondary">
        ReachBee targets WCAG 2.2 AA. This page states our actual current status, including known limitations.
      </p>
      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink">What we do</h2>
          <ul className="prose-measure mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem] text-text-secondary">
            <li>Semantic landmarks, heading hierarchy, and a skip link on every page.</li>
            <li>Full keyboard operation of the directory, composer, approvals, and pipeline; dialogs trap and return focus.</li>
            <li>Contrast-checked light theme; focus rings stay ≥3:1 against adjacent surfaces, including dark sections.</li>
            <li>Status conveyed by text and icon, never color alone; reduced-motion settings disable scroll effects and reveals.</li>
            <li>Touch targets at least 44×44 px on controls.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Known limitations</h2>
          <ul className="prose-measure mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem] text-text-secondary">
            <li>Third-party checkout (Razorpay) and authentication flows have their own accessibility behavior we don’t fully control.</li>
            <li>Kanban drag-and-drop on the pipeline is accompanied by a fully equivalent list/stage dropdown. Drag is never the only way.</li>
          </ul>
        </section>
        <section className="rounded-card border border-border-decorative bg-surface p-5">
          <h2 className="font-bold text-ink">Report a barrier</h2>
          <p className="mt-2 text-sm text-text-secondary">
            If something blocks you, tell us via the <Link href="/contact" className="text-info underline">contact page</Link> and we’ll
            treat it as a defect, not a feature request.
          </p>
          <div className="mt-3">
            <Badge tone="info">Tested: automated checks + manual keyboard review on core flows</Badge>
          </div>
        </section>
      </div>
    </div>
  );
}
