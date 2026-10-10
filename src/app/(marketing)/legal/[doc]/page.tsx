import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalDoc, LEGAL_DOCS } from "@/content/legal";
import { formatDate } from "@/lib/format";
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
    <article className="mx-auto max-w-3xl px-5 py-16">
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
      <p className="text-sm font-bold text-text-secondary">Legal</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">{found.title}</h1>
      <p className="mt-3 text-text-secondary">{found.summary}</p>
      <p className="mt-1 text-sm text-text-disabled">Last reviewed: {formatDate(found.updated)}</p>
      <div className="mt-10 space-y-8">
        {found.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-bold text-ink">{s.heading}</h2>
            <div className="prose-measure mt-2 space-y-2 text-[0.95rem] leading-relaxed text-text-secondary">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <nav aria-label="Other legal documents" className="mt-12 border-t border-border-decorative pt-6">
        <h2 className="text-sm font-bold text-ink">Other documents</h2>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LEGAL_DOCS.filter((d) => d.slug !== found.slug).map((d) => (
            <li key={d.slug}>
              <Link href={`/legal/${d.slug}`} className="text-info underline">
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
