# Launch audit — findings, fixes, and what still needs doing

**Date:** 2026-10-05 · **Scope:** full pre-launch audit of auth, credits, background jobs,
AI drafting, user flow, deployment config, and public claims.

> **Verification status: the compiler and test suite were never run.** The sandbox that
> this audit ran in blocked every shell command for its entire duration. Everything below
> was found by reading code and tracing logic by hand, then cross-checked against the
> TypeScript language server after each edit. Ten real defects were found this way — all
> of them the kind `tsc` or a test catches in seconds — so treat "fixed" below as
> *reviewed and reasoned about*, not *verified*.
>
> ```bash
>   pnpm typecheck && pnpm test    # run this first
> ```

---

## Launch blockers fixed

### Money

| Defect | Where | Effect |
|---|---|---|
| `POST /billing/orders/:id/verify` accepted any client-supplied `razorpayPaymentId` beginning `mock_pay_`, skipping signature verification entirely | `src/server/services/billing.ts` | Any signed-in user could fulfill their own order and receive paid credits **for free, even with live Razorpay keys** |
| Same short-circuit in the live gateway | `src/server/adapters/payments.ts` | Provider state was never consulted; caller-chosen ids answered "captured" |

Fixed: the sandbox path now requires `gateway.mode === "mock" && !isProduction`, and
`RazorpayGateway.fetchPayment` always calls the provider. Regression test added:
`tests/unit/payments.test.ts`.

### Contact reveals

`verifyMailboxPreflight` runs on **every** reveal and used `node:dns` plus a raw port-25
socket. Cloudflare Workers provide neither. The thrown lookup was caught and returned as
`status: "invalid"`, which marks the contact invalid *and* throws — so in production every
reveal would fail and poison the directory. Now returns a distinct `"unavailable"` status
that callers treat as "could not check", never "invalid".
Regression test: `tests/unit/verification.test.ts`.

### Background jobs

No `triggers.crons` in `wrangler.jsonc`, and the OpenNext Cloudflare build emits no
`scheduled` handler — so the `setInterval` worker loop never ticks on Workers. Nothing
drained the job queue: no resume scanning, no AI generation, no credit reconcile, no
digest, and AI reservations stranded as `reserved` forever.

Fixed by adding `POST /api/v1/cron/run` (bearer-auth, constant-time compare) plus
`.github/workflows/scheduled-jobs.yml` calling it every 5 minutes. The endpoint is
idempotent: jobs are claimed under leases, and the digest by a unique
`(user_id, dispatch_date)` row written *before* any email is sent.

The digest is also now **batched through the queue** — a single synchronous loop over
every user exceeds the Worker wall-clock limit and silently strands the remainder.

### Configuration

| Defect | Effect |
|---|---|
| `APP_ENV` / `APP_BASE_URL` absent from `wrangler.jsonc` | Deployed worker defaulted to `development`; every OAuth callback and redirect built against `http://localhost:3000` |
| Production config only `console.warn`ed | Booted silently broken with a missing database or encryption key |
| `src/proxy.ts` + layout guards | Admin pages ran cross-user queries *before* `AdminShell`'s `requireAdmin()` |

`getConfig()` now throws on a missing auth adapter, database, or encryption key, and logs
a loud list of single-feature degradations. Authorization moved into
`src/app/admin/layout.tsx` and `src/app/app/layout.tsx`.

### SQL function migrations

`scripts/db-migrate.ts` applied `src/db/functions.sql` once, by name only. **No fix to an
audited SQL function ever reached an already-migrated database** — including production.
Now tracked by SHA-256 in `_applied_functions` and re-applied on change.

### AI drafting

Three independent dead-ends meant drafting was unusable for every new user:

1. Onboarding posted to `/api/v1/profile/revisions`, which does not exist. The 404 was
   never checked, so no profile row was ever created and every generation failed with
   `NO_CONFIRMED_FACTS`.
2. A draft from the dashboard's "Create an introduction" could never get a recipient. The
   composer said *"Choose a recipient first"* but had no control to do it, and the PATCH
   route dropped the recipient the schema accepted. Wired through end to end, with a picker.
3. `startGeneration` checked `saveState` from a stale closure, so on a version conflict it
   drafted from the last *saved* revision rather than what was on screen.

Reliability: transient provider failures (429/5xx/timeout) were treated as permanent, so a
blip killed the job **and** released the credit. Added `TransientModelError`; attempts
2 → 4. Two failed attempts permanently locked the user out of their own draft (status stuck
at `generating`); fixed on both the start path and the reconcile sweeper.

Credit model, verified rather than changed: **1 credit = 1 draft.** Reserve 1 → consumed in
the same transaction that persists the artifact → early-return if already consumed →
released on every failure path. Accepting costs nothing. A hard cap of **10 drafts per day**
was added.

### Truthfulness of public claims

| Claim | Reality |
|---|---|
| Curated digest seed named **real companies and real executives** with invented openings, emailed to every opted-in user daily | Replaced with fictional content on reserved domains, each labelled "Sample listing" |
| Every backfilled contact rendered "✨ Verified Decision-Maker" regardless of real status | Now reflects actual `verificationStatus` |
| Privacy policy named **Google Gemini** as the model provider | Production uses **OpenRouter**; Resend was missing from processors entirely |
| "Downloads use short-lived authorized links" (×4 surfaces) | No download endpoint existed. Implemented an owner-checked, scan-gated download and rewrote the copy |
| UI showed a fabricated `•••@{company-slug}.example` masked email | Server-computed `maskedEmail` passed through instead |

### Other

Bounce-refund exploit (per-contact guard let a user refund every contact → free directory);
HTML injection of unescaped directory and support text into every inbox; Gmail PKCE verifier
round-tripped through JSON with a hex challenge; resume upload buffered fully before the
size check (OOM); `functions.sql` never re-applied; upload intents not claimed atomically
(double-submit created two resumes); job lease (120s) shorter than the handler it protected;
`deadline_at` frozen with `COALESCE` across retries, so legitimately retrying jobs had their
credits released mid-flight; unguarded row dereferences in the worker loop that aborted the
entire drain pass.

---

## Still blocking launch — configuration only

These are not code changes. Nothing in the repo can fix them.

1. **Clerk is a development instance** (`sk_test_` / `pk_test_`). Needs a production
   instance before any real user signs up.
2. **Secrets** — set with `wrangler secret put`, never in `wrangler.jsonc`:
   `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `DATABASE_URL`,
   `TOKEN_ENCRYPTION_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
   `GOOGLE_OAUTH_REDIRECT_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `OPENROUTER_API_KEY`, `CRON_SECRET`.
3. **Scheduler** — repo secret `CRON_SECRET`, repo variable `APP_URL`. Without these the
   job queue never drains and the digest never sends.
4. **Canonical domain** — `APP_BASE_URL` is set to `reachbee.sayalabs.in`;
   `GOOGLE_OAUTH_REDIRECT_URI` still says `applybee`. Update Google Console and Clerk to
   match, or Gmail connect breaks. `EXTRA_ALLOWED_ORIGINS` already covers both domains for
   cookie-authenticated mutations.
5. **Verify the AI model id** — `pnpm ai:check` exercises the provider through the same
   validation gate the job uses and spends no credit. A 404 means `OPENROUTER_MODEL_ID` is
   not a model the key can use.
6. **Revenue stays off** — `FEATURE_LIVE_PURCHASES_ENABLED=false`, `PAYMENTS_MODE=test`.
7. **Resume malware scanning** — `DOCUMENT_PROCESSOR_ENDPOINT` unset means uploads are
   validated structurally only. Config logs a warning at boot.
8. **Digest content** — ships fictional sample listings. **Keep the digest disabled until
   licensed real listings replace them.** If already seeded, run `TRUNCATE hiring_posts;`
   once — the seed only inserts when the table holds fewer than 10 rows.

---

## Known limitations left in place (documented, not fixed)

- **Gmail auto-reconciliation cannot resolve.** `drafts.list` does not index custom headers,
  so the marker search never matches and every uncertain delivery falls to
  `needs_confirmation` after ~10 minutes. Safe, but not automatic. Fixing it means widening
  the adapter's HTTP allowlist — the exact boundary that blocks send paths — which should be
  a deliberate, tested change.
- **Contact verification cannot run on Workers.** No DNS, no port 25. Fails open now.
- **Daily AI cap is a UTC-day bucket**, not a rolling 24 hours — the quota table keys on
  `window_start`. True rolling windows need a schema change.

---

## What to run first

```bash
pnpm typecheck          # a real typecheck may surface errors in this audit's edits
pnpm test               # unit + integration (integration needs a local/test Postgres)
pnpm ai:check           # confirms the AI provider end-to-end, spends no credit
pnpm dev                # embedded worker runs the queue locally
```

---

## 2026-10-10 — performance pass and SEO surface

Verified with `pnpm typecheck`, `pnpm test` (140/140) and `pnpm build`, then re-checked
against a production `next start` on the deployed host.

**Performance.** Client JS 464.4 kB → 451.1 kB gzipped; dynamic routes 100 → 89 (static 5 → 18);
`/app` routes preload one font instead of two. Five new indexes (`0005_hot_path_indexes.sql`),
including `contacts_updated_idx`, which `EXPLAIN` confirms replaces the directory's sort with a
backward index scan. Fewer round trips per request: session role folded into the user read,
draft editor 6 serial reads → 2 waves, generation polling no longer ships the 20 KB
`input_snapshot` per tick, `credit_accounts` read once per workspace render. The landing hero
is no longer blanked by `.js-motion` before GSAP arrives, and routes with no reveal targets
(`/security`, `/legal/*`, `/accessibility`) stopped downloading GSAP and Lenis at all.

**Reverted on purpose:** parallel digest dispatch starves the pool and blows the 30-second
integration-test timeout. The recipient loop stays serial.

**SEO.** `robots.ts`, `sitemap.ts` (22 URLs), `public/llms.txt`, a 1200×630 `public/og.jpg`
share card, and JSON-LD for Organization/WebSite, SoftwareApplication+Offer (prices read from
the same catalog the page renders), FAQPage (from the same `FAQS` array the page renders),
Article and BreadcrumbList. Every public page now carries a unique title ≤60 chars,
description ≤160, canonical, og/twitter tags. `/app`, `/admin`, `/api`, `/onboarding` and the
auth pages are `noindex` in both meta and `X-Robots-Tag`, and disallowed in robots.txt.

**Removed from the public FAQ page:** `Faq6Demo`, a registry component whose content is a
fabricated crypto-wallet FAQ ("Legend Atlas", Ethereum/Polygon/Arbitrum). It rendered above the
real questions on `/faq`. The `src/components/ui/faq-6/` folder is now unused.

**New launch blockers found here**

1. `applybee.sayalabs.in` and `reachbee.sayalabs.in` both serve the site. Canonicals and the
   sitemap use `reachbee` (matching `wrangler.jsonc` and `deploy.yml`); `applybee` needs a 301
   to it, or the same content competes with itself in the index. This is the same host conflict
   already listed as configuration item 4 above.
2. Clerk is still a test instance, so `/sign-in` and `/sign-up` are the only auth pages, both
   `noindex` — fine for SEO, but nothing converts until the production instance exists.

**Not done here (needs an account, not code):** Google Search Console + Bing Site Index
submission, IndexNow key, and a backlink/directory push. Technical SEO being clean does not
itself produce rankings.

If `typecheck` reports errors in files this audit touched, send them over.