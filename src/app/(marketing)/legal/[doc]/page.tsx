import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalDoc, LEGAL_DOCS } from "@/content/legal";
import { formatDate } from "@/lib/format";
import { ArticleSection, ReadingShell } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { articleSchema, breadcrumbSchema } from "@/lib/seo-schema";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const found = getLegalDoc(doc);
  if (!found) return { title: "Legal" };
  return pageMeta({
    title: found.title,
    description: found.summary,
    path: `/legal/${found.slug}`,
    type: "article",
  });
}

export default async function LegalDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const found = getLegalDoc(doc);
  if (!found) notFound();
  return (
    <article>
      <JsonLd
        data={[
          articleSchema({
            path: `/legal/${found.slug}`,
            headline: found.title,
            description: found.summary,
            dateModified: found.updated,
            section: "Legal",
          }),
          breadcrumbSchema([
            { name: "ReachBee", path: "/" },
            { name: found.title, path: `/legal/${found.slug}` },
          ]),
        ]}
      />
      <ReadingShell label="Legal" meta={`Last reviewed: ${formatDate(found.updated)}`}>
        <h1 className="max-w-[26ch] text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
          {found.title}
        </h1>
        <p className="mt-4 max-w-[62ch] text-[0.9375rem] leading-[1.75] text-text-secondary">{found.summary}</p>
        <div className="mt-9 space-y-9">
          {found.sections.map((section) => (
            <ArticleSection key={section.heading} title={section.heading}>
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </ArticleSection>
          ))}
        </div>
        <nav aria-label="Other legal documents" className="mt-12 border-t border-border-decorative pt-6">
          <h2 className="text-[0.8125rem] font-semibold text-ink">Other documents</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_DOCS.filter((d) => d.slug !== found.slug).map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/legal/${d.slug}`}
                  className="text-[0.8125rem] font-semibold text-text-secondary transition-colors hover:text-ink"
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </ReadingShell>
    </article>
  );
}
