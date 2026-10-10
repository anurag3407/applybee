import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP_ARTICLES, getHelpArticle } from "@/content/help";
import { Badge } from "@/components/ui/primitives";
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
    <article className="mx-auto max-w-3xl px-5 py-16">
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
      <Badge>{article.category}</Badge>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink">{article.title}</h1>
      <div className="prose-measure mt-6 space-y-3 text-[0.95rem] leading-relaxed text-text-secondary">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-10 rounded-card border border-border-decorative bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Related</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {article.related.map((slug) => {
            const rel = getHelpArticle(slug);
            if (!rel) return null;
            return (
              <li key={slug}>
                <Link href={`/help/${slug}`} className="text-info underline">
                  {rel.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
