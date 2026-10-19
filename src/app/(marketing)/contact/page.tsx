import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { PageMasthead, ReadingShell } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/contact");

export default function ContactPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Contact", "/contact"))} />
      <PageMasthead
        eyebrow="Support"
        title="Contact"
        lede="Questions, billing issues, data requests, or security reports. One form, triaged by category."
      />
      <ReadingShell label="Write to us" meta="Replies by email">
        <div className="max-w-[36rem]">
          <ContactForm />
        </div>
      </ReadingShell>
    </div>
  );
}
