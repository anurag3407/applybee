#!/usr/bin/env node
/**
 * SEO pre-flight and post-deploy audit.
 *
 *   node scripts/seo-audit.mjs                                   # local dev server
 *   BASE=https://reachbee.sayalabs.in EXPECT_HOST=reachbee\.sayalabs.in \
 *     node scripts/seo-audit.mjs                                 # a deployed host
 *
 * Checks every URL that should be public for: HTTP 200, a title that fits what
 * Google renders, a description that is not empty or overlong, a canonical that
 * points at the host you actually serve, og/twitter tags, parseable JSON-LD on
 * schema.org, exactly one <h1>, and then the discovery files (robots, sitemap,
 * llms.txt, og.jpg) and the noindex headers on the private areas.
 *
 * Exit code is the number of failing pages, so CI can gate on it.
 */

const BASE = process.env.BASE || "http://127.0.0.1:3000";
const EXPECT_HOST = process.env.EXPECT_HOST || "reachbee\\.sayalabs\\.in";

/** Must stay in sync with MARKETING_PAGES + the help/legal content files. */
const PAGES = [
  "/", "/how-it-works", "/features", "/pricing", "/faq", "/help", "/security",
  "/contact", "/accessibility", "/contact-data/request",
  "/help/get-started", "/help/when-credits-charge", "/help/use-without-gmail",
  "/help/gmail-failed", "/help/resume-upload", "/help/refunds",
  "/legal/privacy", "/legal/terms", "/legal/refunds", "/legal/acceptable-use",
  "/legal/contact-data", "/legal/cookies",
];

/** Must answer with noindex, and never appear in the sitemap. */
const PRIVATE = ["/app", "/admin", "/onboarding/profile", "/sign-in", "/sign-up"];

const meta = (html, key) =>
  (html.match(new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]+content="([^"]*)"`, "i")) || [])[1];
const canonical = (html) =>
  (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i) || [])[1];

function checkPage(path, html, status) {
  const issues = [];
  const title = meta(html, "og:title") || (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
  const desc = meta(html, "description") || "";
  const canon = canonical(html) || "";

  if (status !== 200) issues.push(`HTTP ${status}`);
  if (!title) issues.push("no title");
  if (title.length > 62) issues.push(`title ${title.length} chars`);
  if (!desc) issues.push("no description");
  if (desc.length > 160) issues.push(`description ${desc.length} chars`);
  if (!canon) issues.push("MISSING CANONICAL");
  // Next normalizes the root canonical to the bare origin; Google treats
  // `https://host` and `https://host/` as the same root URL, so accept both.
  const rootForm = path === "/" ? "\\/?" : `/${path.slice(1)}`;
  if (!new RegExp(`^https://${EXPECT_HOST}${rootForm}$`).test(canon))
    issues.push(`canonical is "${canon}"`);
  for (const key of ["og:url", "og:image", "og:site_name", "twitter:card"]) {
    if (!meta(html, key)) issues.push(`no ${key}`);
  }
  if (new RegExp(`https?://(?!${EXPECT_HOST})[a-z0-9.-]*sayalabs`, "i").test(html))
    issues.push("references the other sayalabs host");

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
        if (node["@context"] !== "https://schema.org") issues.push("JSON-LD missing schema.org @context");
        types.push(node["@type"]);
      }
    } catch {
      issues.push("JSON-LD does not parse");
    }
  }
  if (blocks.length === 0) issues.push("no JSON-LD");

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) issues.push(`${h1s} <h1> tags`);

  return { issues, title, desc, types };
}

async function main() {
  let failures = 0;

  for (const path of PAGES) {
    let html = "";
    let status = 0;
    try {
      const res = await fetch(BASE + path, { redirect: "manual" });
      status = res.status;
      html = await res.text();
    } catch (err) {
      console.log(`FAIL ${path.padEnd(26)} unreachable: ${err.message}`);
      failures++;
      continue;
    }
    const { issues, title, desc, types } = checkPage(path, html, status);
    if (issues.length) failures++;
    console.log(
      `${issues.length ? "FAIL" : "ok  "} ${path.padEnd(26)} title=${title.length} desc=${desc.length} ld=${types.join("+") || "-"}${issues.length ? "  → " + issues.join("; ") : ""}`,
    );
  }

  for (const asset of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/og.jpg", "/site.webmanifest"]) {
    try {
      const res = await fetch(BASE + asset);
      const extra =
        asset === "/sitemap.xml" ? ` (${(await res.text()).match(/<loc>/g)?.length ?? 0} urls)` : "";
      const ok = res.status === 200;
      if (!ok) failures++;
      console.log(`${ok ? "ok  " : "FAIL"} ${asset.padEnd(26)} ${res.status}${extra}`);
    } catch (err) {
      failures++;
      console.log(`FAIL ${asset.padEnd(26)} unreachable: ${err.message}`);
    }
  }

  for (const path of PRIVATE) {
    const res = await fetch(BASE + path, { redirect: "manual" });
    const tag = res.headers.get("x-robots-tag") || "";
    const body = res.status < 400 ? await res.text() : "";
    const metaNoindex = /name="robots"[^>]*content="[^"]*noindex/i.test(body);
    const ok = res.status === 307 || res.status === 302 || res.status === 200 ? metaNoindex || tag.includes("noindex") : true;
    if (!ok) failures++;
    console.log(`${ok ? "ok  " : "FAIL"} ${path.padEnd(26)} ${res.status} x-robots="${tag}" meta=${metaNoindex}`);
  }

  const sitemap = await (await fetch(BASE + "/sitemap.xml")).text().catch(() => "");
  for (const leak of ["/app", "/admin", "/api", "/sign-in"]) {
    if (sitemap.includes(`<loc>${BASE}${leak}`) || new RegExp(`<loc>https?://[^<]*${leak}`).test(sitemap)) {
      failures++;
      console.log(`FAIL sitemap.xml leaks ${leak}`);
    }
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} checks failed`);
  process.exit(Math.min(failures, 125));
}

main();
