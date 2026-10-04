import type { Metadata } from "next";
import Link from "next/link";
import { HELP_ARTICLES } from "@/content/help";
import { EmptyState } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Help" };

export default function HelpIndexPage() {
  const categories = [...new Set(HELP_ARTICLES.map((a) => a.category))];
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink">Help</h1>
      <p className="mt-2 text-text-secondary">Goal-oriented guides for the things people actually need.</p>
      {categories.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No articles yet"
            description="Help articles will appear here."
            action={
              <Link href="/contact" className="text-info underline">
                Contact support
              </Link>
            }
          />
        </div>
      ) : (
        categories.map((cat) => (
          <section key={cat} className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">{cat}</h2>
            <ul className="mt-3 divide-y divide-border-decorative rounded-card border border-border-decorative bg-surface">
              {HELP_ARTICLES.filter((a) => a.category === cat).map((a) => (
                <li key={a.slug}>
                  <Link href={`/help/${a.slug}`} className="block px-5 py-4 font-semibold text-ink hover:bg-surface-subtle">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
