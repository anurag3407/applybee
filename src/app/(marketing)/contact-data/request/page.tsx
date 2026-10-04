import type { Metadata } from "next";
import { ContactDataForm } from "@/components/marketing/contact-data-form";

export const metadata: Metadata = { title: "Contact data request" };

export default function ContactDataRequestPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Directory removal or correction</h1>
      <p className="mt-3 text-text-secondary">
        If a directory record lists your professional contact details, you can request removal or correction here — no
        account or purchase required. Removal prevents new reveals and re-imports; we also recheck suppression before
        any Gmail draft creation.
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        See the{" "}
        <a href="/legal/contact-data" className="font-semibold text-ink underline">
          contact-data policy
        </a>{" "}
        for how records are sourced and what verification means (and doesn’t).
      </p>
      <div className="mt-8">
        <ContactDataForm />
      </div>
    </div>
  );
}
