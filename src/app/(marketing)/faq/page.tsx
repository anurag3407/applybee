import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/components/marketing/landing";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Frequently asked questions</h1>
      <p className="prose-measure mt-3 text-lg text-text-secondary">
        Straight answers. If something isn’t here, the <Link href="/help" className="font-semibold text-ink underline">help center</Link> or{" "}
        <Link href="/contact" className="font-semibold text-ink underline">contact page</Link> can help.
      </p>
      <div className="mt-10">
        <FAQ />
      </div>
    </div>
  );
}
