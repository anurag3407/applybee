import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Contact</h1>
      <p className="mt-3 text-text-secondary">
        Questions, billing issues, data requests, or security reports — one form, triaged by category.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
