import { absoluteUrl, site } from "@/lib/seo";

/**
 * Schema.org producers for the public pages.
 *
 * Two rules hold everywhere here: nothing is emitted that the page does not
 * actually show (a fabricated rating or address is a manual-action risk, not a
 * shortcut), and no aggregateRating is ever claimed, because the product has no
 * review corpus to back one.
 */

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: site.url,
    logo: { "@type": "ImageObject", url: absoluteUrl(site.logo), contentUrl: absoluteUrl(site.logo) },
    image: absoluteUrl(site.ogImage),
    description:
      "Career outreach workspace for engineers: verified contact directory, AI introductions grounded in confirmed profile facts, and drafts staged into Gmail.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        contactPointType: "customer support",
        url: absoluteUrl("/contact"),
        availableLanguage: ["English"],
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    url: site.url,
    name: site.name,
    description:
      "Find relevant engineering contacts, write truthful introductions from facts you confirmed, and stage the draft in your Gmail. You review before anything leaves your hands.",
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

/** Root-site graph: one node for the organisation, one for the site. */
export function siteGraph(): Array<Record<string, unknown>> {
  return [organizationSchema(), websiteSchema()];
}

export type OfferSku = {
  name: string;
  pricePaise: number;
  currency: string;
  description: string | null;
};

export function softwareApplicationSchema(params: {
  path: string;
  description: string;
  skus: OfferSku[];
}) {
  const offers = params.skus.map((sku) => ({
    "@type": "Offer",
    name: sku.name,
    description: sku.description ?? `${sku.name} on ReachBee`,
    price: (sku.pricePaise / 100).toFixed(2),
    priceCurrency: sku.currency,
    url: absoluteUrl(params.path),
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "PriceSpecification",
      price: (sku.pricePaise / 100).toFixed(2),
      priceCurrency: sku.currency,
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    url: absoluteUrl(params.path),
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Career outreach and job search",
    operatingSystem: "Web",
    image: absoluteUrl(site.ogImage),
    description: params.description,
    publisher: { "@id": ORG_ID },
    offers,
    featureList: [
      "Verified engineering contact directory",
      "Resume parsing into confirmable profile facts",
      "AI drafts grounded only in confirmed facts",
      "Per-sentence grounding warnings",
      "Manual writing mode and templates",
      "Gmail draft staging",
      "Outreach pipeline and activity log",
      ".eml export",
    ],
  };
}

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleSchema(params: {
  path: string;
  headline: string;
  description: string;
  dateModified?: string;
  section?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.headline,
    description: params.description,
    url: absoluteUrl(params.path),
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
    author: { "@id": ORG_ID },
    ...(params.section ? { articleSection: params.section } : {}),
    ...(params.dateModified ? { dateModified: params.dateModified } : {}),
  };
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
