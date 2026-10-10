import type { MetadataRoute } from "next";
import { HELP_ARTICLES } from "@/content/help";
import { LEGAL_DOCS } from "@/content/legal";
import { MARKETING_PAGES, absoluteUrl, site } from "@/lib/seo";

/**
 * Every URL a crawler is invited to read: the marketing pages, the help centre
 * and the legal documents. The workspace, admin, auth and API routes stay out —
 * they are disallowed in robots.ts as well, so the two files cannot disagree.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const published = new Date(site.publishedAt);

  return [
    ...MARKETING_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: published,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    ...HELP_ARTICLES.map((article) => ({
      url: absoluteUrl(`/help/${article.slug}`),
      lastModified: published,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...LEGAL_DOCS.map((doc) => ({
      url: absoluteUrl(`/legal/${doc.slug}`),
      lastModified: new Date(doc.updated),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
