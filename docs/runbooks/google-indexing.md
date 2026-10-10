# Getting ReachBee indexed — Google, Bing and AI answer engines

**Audience:** whoever deploys this repo. **Time:** ~45 minutes of clicking, then days-to-weeks of waiting on Google.
**Last verified:** 2026-10-10, against a production `next start` of this build.

This document is the ordered procedure for getting `https://reachbee.sayalabs.in` into Google's
index and into the corpora that ChatGPT / Perplexity / Copilot cite. It assumes the technical SEO
layer already in the repo (`src/lib/seo.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`,
`src/components/seo/json-ld.tsx`, `public/llms.txt`) and does not re-explain it.

**What this gets you:** Google and Bing knowing every public page exists, understanding what each
one is about, and being able to quote specific facts (a price, an FAQ answer, a policy date).

**What it does not get you:** a ranking. Indexing and ranking are different problems. Nothing in
this file, and no metadata in this repo, can put you at position 1 for "cold outreach tool" —
that is decided by how many people find the page useful, which is content, links and time.
Anyone promising a top position from a configuration change is selling something.

---

## Step 0 — Deploy this build (blocking)

**Verified state of the live host on 2026-10-10:** `/sitemap.xml`, `/llms.txt` and `/og.jpg` return
**404**, and the marketing pages carry no canonical, no `og:` tags and no JSON-LD. The deployed
build predates all of this work. Do not start Step 2 until you have deployed it, or you will be
verifying a site that has none of it.

```bash
git status                      # the SEO + performance work is uncommitted at the time of writing
pnpm typecheck && pnpm test     # 140 tests must pass
pnpm build:cloudflare           # opennextjs-cloudflare build
pnpm deploy:cloudflare          # or push to main and let .github/workflows/deploy.yml do it
```

`deploy.yml` sets `NEXT_PUBLIC_APP_URL: https://reachbee.sayalabs.in`. That variable is baked at
**build** time, not read at runtime — a build that runs without it now falls back to
`https://reachbee.sayalabs.in` (`DEPLOYED_ORIGIN` in `src/lib/seo.ts`) rather than `localhost`,
which is the failure mode that would have shipped localhost canonicals to Google.

### The local-build trap (verified, do not skip)

`.env` on this machine says `NEXT_PUBLIC_APP_URL=https://applybee.sayalabs.in`. A manual
`pnpm build:cloudflare && pnpm deploy:cloudflare` from a laptop therefore bakes **`applybee`**
canonicals, sitemap URLs and `og:url` into the bundle that CI believes is `reachbee` — which is
precisely the duplicate-host mistake Step 1 exists to prevent, now invisible in the source code.

Observed while writing this: a locally built bundle made `scripts/seo-audit.mjs` fail **all 22
canonical checks** against the expected production host. That is the check working, not the audit
being noisy.

Either fix the default once:

```bash
perl -pi -e 's{^NEXT_PUBLIC_APP_URL=.*}{NEXT_PUBLIC_APP_URL=https://reachbee.sayalabs.in}' .env
perl -pi -e 's{^APP_BASE_URL=.*}{APP_BASE_URL=https://reachbee.sayalabs.in}' .env
```

…or always build explicitly, and never trust an unverified deploy:

```bash
NEXT_PUBLIC_APP_URL=https://reachbee.sayalabs.in pnpm build:cloudflare
BASE=https://reachbee.sayalabs.in node scripts/seo-audit.mjs   # run this against what you deployed
```

Confirm the deploy took:

```bash
curl -sI https://reachbee.sayalabs.in/sitemap.xml | head -1     # expect 200
curl -s  https://reachbee.sayalabs.in/sitemap.xml | grep -c loc  # expect 22
```

---

## Step 1 — Decide one host and 301 the other (blocking)

`wrangler.jsonc` currently registers **both** domains as `custom_domain` routes:

```jsonc
"routes": [
  { "pattern": "applybee.sayalabs.in",  "custom_domain": true },
  { "pattern": "reachbee.sayalabs.in",  "custom_domain": true }
]
```

Two hosts serving identical pages is the single most damaging thing you can do to your own index
position: PageRank splits between them, and Google spends crawls on duplicates. Canonicals and
the sitemap already say `reachbee`, so make `reachbee` the winner.

**Cloudflare dashboard → your zone → Rules → Redirect Rules → Create rule**

| Field | Value |
|---|---|
| Rule name | `canonical-host-reachbee` |
| When incoming requests match | `(http.host eq "applybee.sayalabs.in")` |
| Type | Permanent Redirect 301 |
| From | `http://applybee.sayalabs.in/*` (or `dyn()` with the same host condition) |
| To | `concat("https://reachbee.sayalabs.in/", http.request.uri.path)` + preserve query string |

Then verify:

```bash
curl -sI https://applybee.sayalabs.in/pricing | grep -iE "^(HTTP|location)"
# HTTP/2 301
# location: https://reachbee.sayalabs.in/pricing
```

**Keep `EXTRA_ALLOWED_ORIGINS` in `wrangler.jsonc` as-is** until the redirect has been live long
enough that no session cookie was minted on `applybee` — removing it first causes `FORBIDDEN_ORIGIN`
on cookie-authenticated mutations for anyone mid-session.

If you would rather `applybee` be the canonical host, flip `NEXT_PUBLIC_APP_URL` + `APP_BASE_URL`
in `wrangler.jsonc` and `deploy.yml`, redirect the other way, and re-run the audit in Step 2.
Pick one; do not serve both.

---

## Step 2 — Pre-flight audit (blocking)

Run the repo's own gate against the deployed host:

```bash
BASE=https://reachbee.sayalabs.in node scripts/seo-audit.mjs
```

It checks all 22 public URLs for: HTTP 200, title ≤62 chars, description present and ≤160,
canonical pointing at the expected host, `og:url` / `og:image` / `og:site_name` / `twitter:card`,
parseable JSON-LD on `https://schema.org`, exactly one `<h1>`, no reference to the *other*
sayalabs host, plus `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/og.jpg`, and `noindex` on
`/app`, `/admin`, `/onboarding`, `/sign-in`, `/sign-up`, and that no private path leaked into the
sitemap. Exit code is the failure count, so it belongs in CI.

Expected: `ALL CHECKS PASSED`. Negative control, to prove it is not a rubber stamp:

```bash
BASE=https://reachbee.sayalabs.in EXPECT_HOST='wrong\.example\.com' node scripts/seo-audit.mjs
# → 22 checks failed
```

Then confirm the crawl budget is not being spent on private screens:

```bash
curl -s https://reachbee.sayalabs.in/robots.txt
curl -sI https://reachbee.sayalabs.in/app | grep -i x-robots-tag   # noindex, nofollow, noarchive
```

### Cloudflare settings that block bots by accident

Check all three; each has silently killed a launch.

1. **Security → Bots → "Well-known bots"** must be **On** (lets verified bots through) and
   **Bot Fight Mode** must not be in a mode that challenges them. If you use **Super Bot Fight
   Mode**, add an exception for `Googlebot`, `Bingbot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`.
2. **Security → WAF** — no rate-limit rule that applies to `/robots.txt`, `/sitemap.xml` or the
   marketing routes. A 429 on `/robots.txt` makes Google stop crawling the whole host.
3. **Speed → Optimization / caching** — after any change to `robots.txt` or `sitemap.xml`, do
   **Caching → Purge → Custom URL** for exactly those two paths. Cloudflare will otherwise keep
   serving the old file, and Search Console will report "robots.txt may prevent crawling" for a
   file you already fixed.

---

## Step 3 — Verify the property in Google Search Console

Go to <https://search.google.com/search-console/about> → **Start now**.

### 3a. Use a Domain property (recommended)

1. Choose **Domain**, not URL prefix. Enter `sayalabs.in` (no scheme, no path).
2. Copy the TXT record Google shows you — it looks like:

   ```
   Host name:  @
   Record type: TXT
   Value:      google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. **Cloudflare dashboard → sayalabs.in → DNS → Records → Add record** → TXT, name `@`, paste the
   value, TTL Auto. TXT records on the apex are not proxied, so the orange-cloud toggle is irrelevant.
4. Back in Search Console → **Verify**. If it fails, wait 2–5 minutes (or `dig TXT sayalabs.in`
   to confirm propagation) and retry.

A Domain property covers `https://`, `http://`, every subdomain and both sayalabs hosts, so you
verify once and never re-verify after a deploy. That is why it is the right choice here —
`applybee` and `reachbee` both exist and you want to see both until the 301 settles.

### 3b. Optional: also add a URL-prefix property

Add `https://reachbee.sayalabs.in/` separately if you want per-host sitemaps and a
cross-host-filtered view. Verify it by uploading the suggested HTML file to `public/` (it is
served verbatim at the root) or by adding the meta tag to `src/app/layout.tsx`. Verification
methods are equivalent; the DNS route needs no repo change, which is why 3a is preferred.

### 3c. Users and permissions

**Settings → Users and permissions → Add.** Give the marketing owner *Full* only if they must
disavow or change property ownership; *Restricted* is enough to read reports.

---

## Step 4 — Submit the sitemap

1. **Indexing → Sitemaps → Add a new sitemap.**
2. Enter `https://reachbee.sayalabs.in/sitemap.xml` → **Submit**.
3. Repeat with `https://applybee.sayalabs.in/sitemap.xml` **only if** you have not done Step 1 —
   if the 301 is in place, skip it; Google will follow the redirect from the old host's robots.txt.

What the columns mean, and what to expect:

| Column | Meaning | Reality for a new domain |
|---|---|---|
| Submitted | URLs in the file | 22 |
| Indexed | URLs in the index | starts at 0–3, climbs over days–weeks |

Do not resubmit the sitemap daily; it is re-read on its own schedule. If it says "Couldn't
fetch", purge the Cloudflare cache for that URL (Step 2) and check for a WAF rule.

The file is generated from `src/app/sitemap.ts`, which reads `MARKETING_PAGES` in `src/lib/seo.ts`
plus `src/content/help.ts` and `src/content/legal.ts`. **Adding a public page means adding it to
`MARKETING_PAGES`** — `pageMetaFor()` throws at build time for an unknown path, which is
deliberate: a page shipping without a title or description is worse than a failed build.

---

## Step 5 — Ask Google to index the pages that matter

Sitemap submission is discovery. Manual requests are for the handful of pages you want looked at
first.

1. **URL inspection** (top bar) → paste `https://reachbee.sayalabs.in/` → Enter.
2. Wait for "Page fetched by Google…" → if it says *Indexed* or *Discovered*, click
   **Request indexing**. Confirm "Live test OK" appears; if the URL is flagged as noindex or
   blocked, fix that before continuing.
3. Repeat, in this order (priority, not all at once — the quota is dozens per day, not hundreds):

   ```
   /  /pricing  /features  /how-it-works  /faq  /help  /help/get-started  /security
   ```

4. Do **not** request `/app`, `/admin`, `/sign-in`, `/sign-up`. They are noindex by design and
   each request wastes quota.

Then stop touching it. The `Pages (Indexing)` report is the source of truth from here; it updates
on Google's schedule, not yours.

---

## Step 6 — Bing Webmaster Tools and IndexNow (this is the AI-search path)

ChatGPT's search, Copilot and several other assistants answer from **Bing's index**, not Google's.
If you want to be cited by AI search, Bing is the higher-leverage submission.

1. <https://www.bing.com/webmasters> → **Add a site** → you can import the verified Google
   property directly (fastest) or verify with a DNS TXT at Cloudflare.
2. **Sitemaps → Submit sitemap** → `https://reachbee.sayalabs.in/sitemap.xml`.
3. **Configuration → API → IndexNow**: copy your key.
4. Host the key file so IndexNow can prove ownership: put the key string in
   `public/<your-key>.txt` (deployed, it must answer at
   `https://reachbee.sayalabs.in/<your-key>.txt`), then ping:

   ```bash
   curl -X POST "https://api.indexnow.org/indexnow" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{"host":"reachbee.sayalabs.in","key":"YOUR_KEY","urlList":[
       "https://reachbee.sayalabs.in/",
       "https://reachbee.sayalabs.in/pricing",
       "https://reachbee.sayalabs.in/faq",
       "https://reachbee.sayalabs.in/help/get-started"
     ]}'
   # 200 = accepted, 202 = received
   ```

IndexNow is how you get *re-crawled* in minutes after a content change on Bing-backed surfaces.
It has no Google equivalent; Google just crawls when it feels like it.

---

## Step 7 — Confirm AI crawlers can actually reach the content

`public/llms.txt` is a convention, not a contract — no assistant is obliged to read it. What
matters is that the bots can fetch the pages and that the answers are in the HTML (they are: the
marketing pages, help centre and FAQ prerender as static HTML with no JavaScript required).

```bash
for bot in GPTBot OAI-SearchBot ClaudeBot PerplexityBot Google-Extended; do
  printf '%-18s %s\n' "$bot" \
    "$(curl -s -o /dev/null -w '%{http_code}' -A "Mozilla/5.0 (compatible; $bot/1.0)" \
       https://reachbee.sayalabs.in/faq)"
done
# every line should be 200. A 403/429 means Cloudflare bot protection is eating your AI traffic.
```

To see whether they have arrived at all: **Cloudflare → zone → Analytics → Requests**, filter by
user-agent, or check the Worker's own logs. Zero hits weeks after launch usually means a WAF
rule, not disinterest.

---

## Step 8 — Monitor: what each status means *here*

Check once a week for the first month, then monthly. In **Pages (Indexing)**, the reason column
is the diagnosis:

| Google says | Cause on this site | Fix |
|---|---|---|
| Duplicate, Google chose different canonical | `applybee` and `reachbee` both live | Step 1 (301). Then use **Removals → Temporarily remove** on the wrong host's URLs to speed up the swap |
| Discovered – currently not indexed | Normal for a new domain with few links | Improve internal links (footer + related-articles blocks already exist), add content, wait |
| Crawled – currently not indexed | Google read it and decided it adds nothing | Real signal. Make the page answer something specific; the help centre is where this is winnable |
| Alt + as: robots.txt may prevent | Cloudflare cached the old `robots.txt` | Purge `/robots.txt` (Step 2) |
| Blocked due to unauthorized request (401) / Redirect page | A private URL got linked from a public page | Remove the link; keep the noindex |
| Page with redirect | Old host URLs still in the index | Correct after Step 1; it resolves itself over weeks |
| Not found (404) on a URL you submitted | Slug typo in `MARKETING_PAGES` | `node scripts/seo-audit.mjs` catches this before Google does |

Also worth watching:

- **Performance → Core Web Vitals** — meaningful once there is real traffic. The static marketing
  routes and the reduced client bundle from the performance pass are what this will report on.
- **Links → Top linked pages** — if Google's list of who links to you is empty, that, not
  metadata, is why you are not ranking.
- **Performance → Pages**, then toggle "Query" off and compare **impressions** week over week.
  Filter out branded queries to see whether strangers are finding you at all.

---

## Step 9 — What actually moves ranking (the honest list)

1. **Pages that answer a specific question people type.** The help centre and FAQ are the only
   content on this site that does that today. Expanding it — "how to find the hiring manager's
   email", "cold email subject lines for engineering roles", "is it legal to email a recruiter" —
   is the highest-leverage SEO work available here, and it is writing, not configuration.
2. **Links from places that already have authority.** Product Hunt, Indie Hackers, Hacker News
   Show HN, SaaS directories, engineering newsletters, your own GitHub README and LinkedIn
   profile. Each is worth more than every meta tag in this repo combined.
3. **Consistency of the claim.** Structured data must keep matching the visible page. `FAQPage`
   is generated from the same `FAQS` array the page renders and `Offer` prices come from the same
   catalog the pricing table reads — if you ever hand-write markup that contradicts the page,
   that is a manual-action risk, not an optimization.
4. **Time.** New domains take weeks to months for non-branded queries. This is normal and is not
   a bug you can config away.

---

## Not applicable / do not do

- **Indexing API.** Only usable for pages with `JobPosting` or `BroadcastEvent` structured data,
  and Google revokes access for misuse. ReachBee has neither today: `hiring_posts` ships
  **fictional sample listings** (see `docs/launch-audit.md`) and is not published as public job
  pages. If you ever publish real, licensed listings at public URLs with `JobPosting` markup,
  this becomes the fastest indexing path — until then, do not wire it up.
- **`?index=1` / noindex tag removal on `/app`.** Those screens are session-bound; a crawler only
  ever sees a 307 to sign-in. Indexing them creates thin duplicates and a privacy problem.
- **Meta keywords.** Ignored by Google since 2009. Not present in this repo on purpose.
- **`robots.txt` as a deindexing tool.** Disallow means "don't crawl", which still lets Google
  index a URL from links with no description. `noindex` is what removes; that is why the private
  areas have both the header and the meta tag.

---

## Maintenance

| When you… | Also do |
|---|---|
| Add a public marketing page | Add its path, title and description to `MARKETING_PAGES` in `src/lib/seo.ts`, call `pageMetaFor(path)` in the page, and add it to `PAGES` in `scripts/seo-audit.mjs` |
| Add a help article | Add it to `src/content/help.ts` — sitemap, `/help` index and `Article` JSON-LD all read from there |
| Change a price | Nothing to do: `Offer` markup reads the same catalog the page renders |
| Change `robots.ts` or `sitemap.ts` | Purge those two URLs in Cloudflare, then re-run the audit |
| Ship anything SEO-related | `BASE=https://reachbee.sayalabs.in node scripts/seo-audit.mjs` — and consider adding it to `deploy.yml` after the deploy step |

## Checklist

- [ ] This build deployed; `/sitemap.xml` returns 200 with 22 URLs
- [ ] `applybee.sayalabs.in` 301s to `reachbee.sayalabs.in`
- [ ] `node scripts/seo-audit.mjs` → `ALL CHECKS PASSED` against the live host
- [ ] Cloudflare bot settings verified; `/robots.txt` and `/sitemap.xml` purged after deploy
- [ ] Domain property `sayalabs.in` verified in Search Console
- [ ] `https://reachbee.sayalabs.in/sitemap.xml` submitted
- [ ] Indexing requested for `/`, `/pricing`, `/features`, `/how-it-works`, `/faq`, `/help`
- [ ] Bing Webmaster Tools verified + sitemap submitted
- [ ] IndexNow key file deployed in `public/` and initial ping returned 200/202
- [ ] Bot-UA curl sweep in Step 7 returns 200 for every crawler
- [ ] Weekly `Pages (Indexing)` review scheduled
