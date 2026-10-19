import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP_ARTICLES, getHelpArticle } from "@/content/help";
import { ReadingShell } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { articleSchema, breadcrumbSchema } from "@/lib/seo-schema";
import { metaDescription, pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return { title: "Help" };
  return pageMeta({
    title: article.title,
    description: metaDescription(article.body[0] ?? ""),
    path: `/help/${article.slug}`,
    type: "article",
  });
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();
  return (
    <article>
      <JsonLd
        data={[
          articleSchema({
            path: `/help/${article.slug}`,
            headline: article.title,
            description: metaDescription(article.body[0] ?? ""),
            section: article.category,
          }),
          breadcrumbSchema([
            { name: "ReachBee", path: "/" },
            { name: "Help", path: "/help" },
            { name: article.title, path: `/help/${article.slug}` },
          ]),
        ]}
      />
      <ReadingShell label={article.category} meta="Help center">
        <Link
          href="/help"
          className="text-[0.8125rem] font-semibold text-text-secondary transition-colors hover:text-ink"
        >
          ← All help articles
        </Link>
        <h1 className="mt-6 max-w-[24ch] text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
          {article.title}
        </h1>
        <div className="mt-6 space-y-4 border-t border-border-decorative pt-6 text-[0.9375rem] leading-[1.75] text-text-secondary">
          {article.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="mt-10 border-t border-border-decorative pt-6">
          <h2 className="text-[0.8125rem] font-semibold text-ink">Related</h2>
          <ul className="mt-2">
            {article.related.map((relatedSlug) => {
              const rel = getHelpArticle(relatedSlug);
              if (!rel) return null;
              return (
                <li key={relatedSlug} className="border-b border-border-decorative last:border-b-0">
                  <Link
                    href={`/help/${relatedSlug}`}
                    className="group flex min-h-11 items-center justify-between gap-6 py-3 text-[0.875rem] font-semibold text-ink"
                  >
                    {rel.title}
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
              );
            })}
          </ul>
        </div>
      </ReadingShell>
    </article>
  );
}
