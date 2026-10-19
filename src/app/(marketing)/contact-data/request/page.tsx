import type { Metadata } from "next";
import { ContactDataForm } from "@/components/marketing/contact-data-form";
import { PageMasthead, ReadingShell, TextLink } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/contact-data/request");

export default function ContactDataRequestPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Contact data request", "/contact-data/request"))} />
      <PageMasthead
        eyebrow="Privacy"
        title="Directory removal or correction"
        lede="If a directory record lists your professional contact details, you can request removal or correction here. No account or purchase required. Removal prevents new reveals and re-imports; we also recheck suppression before any Gmail draft creation."
      />
      <ReadingShell label="Request" meta="No account required">
        <p className="text-[0.875rem] leading-[1.7] text-text-secondary">
          See the <TextLink href="/legal/contact-data">contact-data policy</TextLink> for how records are sourced and
          what verification means (and doesn’t).
        </p>
        <div className="mt-8 max-w-[36rem]">
          <ContactDataForm />
        </div>
      </ReadingShell>
    </div>
  );
}
