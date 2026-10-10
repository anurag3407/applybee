import type { MetadataRoute } from "next";
import { site } from "@/lib/seo";

/**
 * Crawl rules for the public site.
 *
 * The workspace (`/app`), admin, auth and onboarding routes are disallowed:
 * they are behind a session, they change under the same URL, and a crawler that
 * lands there only ever sees a redirect to sign-in. `/api` is disallowed so
 * JSON never becomes a canonical for a page.
 *
 * AI crawlers are allowed on purpose. The marketing pages, help centre and FAQ
 * are written as answers — that is the surface an assistant cites — so blocking
 * those bots would remove the one thing this site can rank for, while the
 * private routes stay closed to everyone.
 */
const PRIVATE_PATHS = ["/app/", "/admin/", "/api/", "/onboarding/", "/sign-in", "/sign-up"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "DuckAssistBot",
        ],
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url.replace(/^https?:\/\//, ""),
  };
}
