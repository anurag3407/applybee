import type { Metadata } from "next";
import Link from "next/link";
import { HELP_ARTICLES } from "@/content/help";
import { EmptyState } from "@/components/ui/empty-state";
import { PageMasthead } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/help");

export default function HelpIndexPage() {
  const categories = [...new Set(HELP_ARTICLES.map((a) => a.category))];
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Help", "/help"))} />
      <PageMasthead
        eyebrow="Support"
        title="Help"
        lede="Goal-oriented guides for the things people actually need."
      />
      {categories.length === 0 ? (
        <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 pb-20 pt-12 sm:px-6 md:pt-16 lg:px-8">
          <EmptyState
            title="No articles yet"
            description="Help articles will appear here."
            action={
              <Link href="/contact" className="text-[0.875rem] font-semibold text-ink underline decoration-border-control underline-offset-4">
                Contact support
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 pb-20 pt-10 sm:px-6 md:pt-14 lg:px-8">
          <div className="border-t border-border-decorative">
            {categories.map((cat) => (
              <section
                key={cat}
                className="grid gap-4 border-b border-border-decorative py-8 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-12 lg:gap-20"
              >
                <h2 className="text-[0.8125rem] font-semibold leading-snug text-ink">{cat}</h2>
                <ul className="min-w-0">
                  {HELP_ARTICLES.filter((a) => a.category === cat).map((a) => (
                    <li key={a.slug} className="border-t border-border-decorative first:border-t-0">
                      <Link
                        href={`/help/${a.slug}`}
                        className="group flex min-h-12 items-center justify-between gap-6 py-3 text-[0.9375rem] font-semibold text-ink"
                      >
                        <span>{a.title}</span>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 16 16"
                          aria-hidden
                          className="shrink-0 text-text-disabled transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                        >
                          <path d="M3 8h9M9 5l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
