import type { Metadata } from "next";
import { Badge } from "@/components/ui/primitives";
import { ArticleSection, PageMasthead, ReadingShell, TextLink } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/accessibility");

export default function AccessibilityPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Accessibility", "/accessibility"))} />
      <PageMasthead
        eyebrow="Trust"
        title="Accessibility"
        lede="ReachBee targets WCAG 2.2 AA. This page states our actual current status, including known limitations."
      />
      <ReadingShell label="Statement">
        <div className="space-y-9">
          <ArticleSection title="What we do">
            <ul className="space-y-1.5">
              <li>Semantic landmarks, heading hierarchy, and a skip link on every page.</li>
              <li>Full keyboard operation of the directory, composer, approvals, and pipeline; dialogs trap and return focus.</li>
              <li>Contrast-checked light theme; focus rings stay ≥3:1 against adjacent surfaces, including dark sections.</li>
              <li>Status conveyed by text and icon, never color alone; reduced-motion settings disable scroll effects and reveals.</li>
              <li>Touch targets at least 44×44 px on controls.</li>
            </ul>
          </ArticleSection>
          <ArticleSection title="Known limitations">
            <ul className="space-y-1.5">
              <li>
                Third-party checkout (Razorpay) and authentication flows have their own accessibility behavior we don’t
                fully control.
              </li>
              <li>
                Kanban drag-and-drop on the pipeline is accompanied by a fully equivalent list/stage dropdown. Drag is
                never the only way.
              </li>
            </ul>
          </ArticleSection>
          <ArticleSection title="Report a barrier">
            <p>
              If something blocks you, tell us via the <TextLink href="/contact">contact page</TextLink> and we’ll treat
              it as a defect, not a feature request.
            </p>
            <div className="pt-2">
              <Badge tone="info">Tested: automated checks + manual keyboard review on core flows</Badge>
            </div>
          </ArticleSection>
        </div>
      </ReadingShell>
    </div>
  );
}
