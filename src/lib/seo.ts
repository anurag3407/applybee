import type { Metadata } from "next";

/**
 * SEO surface for the public site: one place that decides the origin, the page
 * inventory, and how a page's `<title>`, description and canonical are formed.
 *
 * The origin is the deployed host, not localhost: `metadataBase` and every
 * absolute URL in the sitemap, robots file and Open Graph tags resolve against
 * it, and a `localhost` fallback would leak into indexed canonicals the first
 * time an environment forgets to set `NEXT_PUBLIC_APP_URL`.
 */
/**
 * The origin the deployed Worker and the CI build both use (`wrangler.jsonc`
 * vars and `.github/workflows/deploy.yml`). Used only as a fallback: a build
 * that forgets to set `NEXT_PUBLIC_APP_URL` would otherwise publish `localhost`
 * canonicals and a sitemap full of `localhost` URLs to Google, which is worse
 * than having no SEO at all.
 */
const DEPLOYED_ORIGIN = "https://reachbee.sayalabs.in";

export const site = {
  name: "ReachBee AI",
  shortName: "ReachBee",
  tagline: "Direct outreach beyond saturated job portals",
  url: (process.env.NEXT_PUBLIC_APP_URL || DEPLOYED_ORIGIN).replace(/\/+$/, ""),
  logo: "/icon-512.png",
  ogImage: "/og.jpg",
  /** Date the public site content was published. Legal documents carry their own. */
  publishedAt: "2026-10-04",
} as const;

export function absoluteUrl(path: string): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Marketing pages that should appear in search, in crawl-priority order.
 *
 * Titles stay under ~60 characters and descriptions under ~160 because Google
 * truncates past those; both state a fact a searcher can check on the page
 * rather than a claim the page does not support.
 */
export const MARKETING_PAGES: Array<{
  path: string;
  title: string;
  description: string;
  priority: number;
}> = [
  {
    path: "/",
    title: "ReachBee AI: Direct Outreach Beyond Saturated Job Portals",
    description:
      "Find verified engineering contacts, ground your confirmed achievements into truthful introductions, and stage drafts in Gmail.",
    priority: 1,
  },
  {
    path: "/how-it-works",
    title: "How ReachBee Works: Facts to Gmail Draft",
    description:
      "The four steps a ReachBee draft takes — confirmed facts, contact, grounding, Gmail — and what the tool never does for you.",
    priority: 0.9,
  },
  {
    path: "/features",
    title: "Features: Verified Contacts and Grounded Drafts",
    description:
      "Directory search, resume intelligence, agentic drafting, manual writing, templates, pipeline and .eml export — what each does.",
    priority: 0.9,
  },
  {
    path: "/pricing",
    title: "Pricing: One-Time Credit Packs, No Subscription",
    description:
      "Pay per contact reveal and per validated AI draft. Failed generations release the credit, manual writing is always free.",
    priority: 0.9,
  },
  {
    path: "/faq",
    title: "FAQ: Credits, Gmail Access, the 10-Draft Daily Cap",
    description:
      "Straight answers on when credits charge, why AI drafts are capped at 10 a day, what Gmail scopes we ask for, and data deletion.",
    priority: 0.8,
  },
  {
    path: "/help",
    title: "Help Centre: Guides for Getting Started",
    description:
      "Goal-oriented guides: getting started, how credits are charged, using ReachBee without Gmail, resumes and refunds.",
    priority: 0.8,
  },
  {
    path: "/security",
    title: "Security: Encryption, Gmail Scopes, Retention",
    description:
      "How contact emails are stored, the exact Gmail permissions we request, the daily delivery cap, and what we never send.",
    priority: 0.7,
  },
  {
    path: "/contact",
    title: "Contact ReachBee",
    description: "Reach a human for support, account closure, or a question about how a draft was written.",
    priority: 0.6,
  },
  {
    path: "/accessibility",
    title: "Accessibility Statement",
    description: "The standard we build to, keyboard support, the limitations we know about, and how to report a barrier.",
    priority: 0.5,
  },
  {
    path: "/contact-data/request",
    title: "Request Your Contact Data",
    description: "Ask what directory data we hold about you, correct it, or have it removed. No account needed.",
    priority: 0.4,
  },
];

/**
 * The root layout appends "· ReachBee" to every title. That is right for a page
 * called "Pricing" and wrong once a title already carries the brand or is long
 * enough that the suffix pushes it past what Google renders (~60 characters).
 * `absolute` opts the page out of the template; the brand is appended only when
 * there is room for it.
 */
const BRAND_SUFFIX = " · ReachBee";
const TITLE_MAX = 60;

function titled(title: string): { absolute: string } {
  if (title.includes("ReachBee")) return { absolute: title };
  return {
    absolute: title.length + BRAND_SUFFIX.length <= TITLE_MAX ? `${title}${BRAND_SUFFIX}` : title,
  };
}

/**
 * Metadata for one public page. Canonical comes from the page's own path so a
 * mirrored host or a stray `?utm_` variant cannot become the indexed URL.
 */
export function pageMeta(params: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const { title, description, path, type = "website" } = params;
  const url = absoluteUrl(path);
  const image = absoluteUrl(site.ogImage);
  const displayTitle = titled(title);
  return {
    title: displayTitle,
    description,
    // Absolute, so the root page's canonical keeps its trailing slash and
    // matches the URL the sitemap advertises for it.
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: site.name,
      title: displayTitle.absolute,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle.absolute,
      description,
      images: [image],
    },
  };
}

/** Collapse authored prose into a meta description Google will not truncate. */
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[\s,;:.]+$/, "")}…`;
}

/** Metadata for the signed-in app, admin and auth surfaces. */
export const noIndexMeta: Metadata = {
  robots: { index: false, follow: false },
};

/** Two-level crumb trail: the site, then this page. */
export function breadcrumbTrail(name: string, path: string) {
  return [
    { name: site.shortName, path: "/" },
    { name, path },
  ];
}

/**
 * Metadata for a page in MARKETING_PAGES, addressed by path so the sitemap, the
 * canonical and the visible title can never drift apart. A wrong path is a
 * build-time error rather than a page that quietly ships without a description.
 */
export function pageMetaFor(path: string): Metadata {
  const page = MARKETING_PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`pageMetaFor: "${path}" is not in MARKETING_PAGES`);
  return pageMeta(page);
}
