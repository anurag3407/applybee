# Apply Bee — implementation status

**Date:** 2026-10-04 · **Source spec:** `plan.md` (2026-10-04) + `PRD.md` (superseded on conflicts by the plan)
**State:** core product implemented and verified locally end-to-end; external live integrations remain honestly flagged off pending real credentials/approvals (see “External gates”).

---

## What was built (Milestone map §32)

| Milestone | Status | Evidence |
|---|---|---|
| M1 — repo foundation, tokens, shells | **Done** | `pnpm typecheck` clean; design tokens in `src/styles/tokens.css`; marketing/app/admin shells; error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `/access-denied`, `/service-unavailable`) |
| M2 — persistence + financial primitives | **Done** | Full §17 schema (`src/db/schema.ts`, ~55 tables incl. lots/reservations/ledger/allocations); audited SQL functions (`src/db/functions.sql`): provision+trial, reveal, reserve/complete/release, fulfill payment, accept proposal, claim/complete/retry jobs, quota admission, concurrency slots, consistency verifier |
| M3 — auth + provisioning | **Done (dev adapter)** | Labeled dev session adapter + provisioning via SQL function; Clerk wiring documented in `docs/adr/0001-platform.md`; tombstones tested |
| M4 — directory + governance | **Done** | URL-driven search/filters/keyset pagination; masked emails everywhere; atomic reveal with idempotency + rate limits; saved contacts + tombstones; reports; admin suppression with scopes |
| M5 — manual composer + templates | **Done** | Own/directory recipients, version-checked autosave, conflict dialog, templates with placeholder preview/unknown-var warnings, copy + `.eml` export (fixture-verified MIME) |
| M6 — resumes + profile | **Done (structural scanner)** | Upload intents, 5 MiB/10-page/enforcement, magic-byte/encryption checks, quarantine→immutable clean key, parse (Gemini w/ key; labeled sample parser otherwise), fact review → approved revisions. **Antivirus requires the isolated processor (launch gate)** |
| M7 — queue + quick AI | **Done** | Postgres jobs + outbox + leases/fencing + retries + recovery sweep; reserve → validated proposal → consume/release; version-checked acceptance; polling UI (2s→5s→10s) |
| M8 — agentic preparation | **Done (bounded)** | Same job path with bounded mode; grounding from confirmed facts + approved dated evidence; structured output validated against snapshot IDs (§15.3); evidence/warnings surfaced |
| M9 — Gmail | **Done (draft-only, sandbox)** | OAuth PKCE flow (live w/ creds), token envelope AES-256-GCM, approval snapshots + hashes, create-only worker, attempt records with pre-call evidence, unknown→reconcile→needs_confirmation, explicit duplicate-warned recreate, HTTP allowlist rejects send paths (negative test) |
| M10 — payments | **Done (sandbox)** | Versioned server catalog, order snapshots in paise, webhook HMAC + durable event dedupe, grant-once fulfillment, ledger/balances/history UI, labeled sandbox checkout (Razorpay script path implemented, needs live keys) |
| M11 — pipeline/reminders/dashboard | **Done** | Stages w/ dropdown (drag never required), notes, next-action reminders materialized as deduped in-app notifications, dashboard from real data only |
| M12 — marketing | **Done** | 12 sections per §10 + header/footer; GSAP ScrollTrigger reveals + Lenis (marketing-only, reduced-motion opt-out, no permanent hidden copy); catalog-driven pricing (no invented prices; honest unavailability state) |
| M13 — admin/privacy/hardening | **Done (core)** | Admin health/contacts(suppress)/companies/users/payments/jobs/reports/audit/config; export + deletion lifecycle; durable quota admission; audit trail; origin checks; private `no-store` headers |
| M14 — production deployment + drills | **Not started (deliberately)** | No cloud credentials in this environment. Runbooks + ADRs written; live features stay flag-gated |

## Verification evidence (run locally)

- `pnpm typecheck` — clean (strict TS).
- `pnpm build` — Next.js 16 production build succeeds (all routes).
- `pnpm test` — 27/27 passing:
  - **Integration (real Postgres):** 20 concurrent reveals of one contact → exactly 1 unlock + 1 debit; last-AI-credit race → one reservation, one `INSUFFICIENT_AI_CREDITS`; release/consume idempotency (release cannot revive a consumed charge); lot conservation + account-vs-lot consistency (`verify_credit_consistency` = 0 issues); trial once-per-identity incl. delete-and-reregister; deleted-account tombstone; payment grant-exactly-once vs duplicate fulfillment + amount-mismatch rejection; proposal acceptance with version conflict preserving manual edits.
  - **Unit:** MIME golden fixtures (CRLF, RFC 2047, attachment base64 wrapping, injection rejection, no-send surface), envelope crypto roundtrip + AAD/tamper rejection, validation bounds, template placeholders.
- **End-to-end (dev server + real browser):** dev sign-in → trial grant (5/2) → directory search (masked) → reveal (charged once; repeat with different key returned existing unlock, no second charge) → profile facts confirmed → draft → autosave → generation 202 → reservation visible in balances → worker consumed → proposal accepted (v1→v2) → approval hash → delivery job → `created` with attempt evidence → `.eml` export → sandbox order (server-priced 29900 paise) → verify → fulfilled → balances 154/31 consistent.
- Admin pages render 200 with role enforcement; unauthenticated access redirects.

## External gates (honest flags, per plan §32.1.4/§33.3)

| Gate | Current state | Unblocks |
|---|---|---|
| Clerk credentials | Dev session adapter active; ADR written | Production sign-in (config auto-switches) |
| Google OAuth client + restricted-scope verification | Code paths ready; sandbox connection is labeled | Real Gmail draft creation |
| Razorpay live keys + economics sign-off | Mock gateway + labeled sandbox checkout; `FEATURE_LIVE_PURCHASES_ENABLED=false` | Real sales |
| Gemini API key + AI terms review | Labeled “Sample AI (offline)” mock adapter | Real AI drafts (`GEMINI_API_KEY` + `GEMINI_MODEL_ID`) |
| Isolated document processor (ClamAV) | Structural validation only; disclosed in UI | Resume attachments in production |
| Licensed contact data | Fictional seed on reserved `.example` domains | Real directory |
| Legal review of policies | Legal pages written, marked “last reviewed 2026-10-04”, pre-launch | Public launch |
| IaC + restore drill | Runbooks + Dockerfile draft; nothing provisioned | Deployment |

## Known deviations / notes

1. **Auth adapter:** the plan mandates Clerk; this build ships the full app behind an adapter interface with a labeled local development session. `getConfig()` now throws in production when Clerk keys are missing, when `DATABASE_URL` is unset/localhost, or when `TOKEN_ENCRYPTION_KEY` is absent or malformed — the dev adapter can no longer reach production. Wiring steps in ADR 0002.
2. **React Query** (§5.1) intentionally omitted; server state via RSC + small polling hooks — fewer dependencies, same behavior. Documented in ADR 0001.
3. **Direct server-mediated uploads** locally (no presigned PUT without a real bucket); the storage adapter interface matches S3/R2 semantics for production. Upload bodies are read from the request stream under a 5 MiB cap rather than buffered whole.
4. **Embedded dev worker** via `instrumentation.ts` executes the same durable DB jobs with outbox/idempotency semantics. **This does not work on Cloudflare Workers** — Workers freeze between requests, so the `setInterval` loop never ticks in production and the OpenNext build emits no `scheduled` handler. Production background work (resume scanning, AI generations, credit reconcile, reminders, the daily digest) is driven by `POST /api/v1/cron/run` with `Authorization: Bearer $CRON_SECRET`, scheduled by `.github/workflows/scheduled-jobs.yml`. See “Background jobs in production” in the README.
5. **Next.js 16** renamed `middleware.ts` → `proxy.ts` (adopted). Exact versions pinned in `package.json`.
6. `src/db/functions.sql` is re-applied whenever its contents change (tracked by SHA-256 in `_applied_functions`), so audited SQL function fixes actually reach an already-migrated database.
7. Admin authorization is enforced in `src/app/admin/layout.tsx`, not only inside `AdminShell`, so a non-admin request is rejected before any admin page body runs its cross-user queries.
8. **Gmail reconciliation does not auto-resolve.** `listRecentDraftMarkers` searches `drafts.list` with `q=in:draft X-ApplyBee-Operation:<marker>`. Gmail's search syntax does not index arbitrary custom headers, so this returns no matches and every uncertain delivery falls through to `needs_confirmation` after ~10 minutes of retries. The failure mode is safe (the user is asked to check their Drafts folder rather than being told a false outcome), but automatic confirmation does not work. Fixing it requires either a Gmail label or adding `messages.get` to the adapter's HTTP allowlist — a change to a send-blocking security boundary that should be made deliberately, with tests.
9. **Contact verification cannot run on Cloudflare Workers.** The probe needs DNS plus a raw port-25 socket, neither of which Workers provide. `verifyMailboxPreflight` now returns `unavailable` in that runtime rather than reporting a false negative, so reveals are not blocked — but no contact is genuinely verified in production. Directory `verificationStatus` values come from licensed/seeded data.
12. **The daily digest ships only fictional sample listings.** `INITIAL_CURATED_POSTS` previously named real companies and real executives with invented openings, and was emailed to every opted-in user each morning. It is now fictional content on reserved domains, every entry is labelled "Sample listing", and the digest badge reflects the contact's real `verificationStatus` instead of claiming "Verified Decision-Maker" unconditionally. **The digest should stay disabled in production until licensed, real listings replace it** — if you already seeded, run `TRUNCATE hiring_posts;` once.
10. Resume malware scanning requires the isolated document processor. Without `DOCUMENT_PROCESSOR_ENDPOINT`, uploads are validated structurally (magic bytes, encryption, page count) and marked clean on that basis alone; config logs a warning at boot when this is the case.

## Operator checklist before enabling live capability

1. Set real credentials (`.env.example` inventory) via `wrangler secret put`, set `APP_ENV=production` in `wrangler.jsonc` vars. Config validation refuses to boot on a missing auth adapter, database, or encryption key, and logs a loud list of any feature-degrading gaps (missing webhook secrets, no AI key, no document processor).
2. If the deployment serves more than one custom domain, set `EXTRA_ALLOWED_ORIGINS` so users on the non-canonical host are not blocked from every form.
3. Register `CRON_SECRET` as a repository secret and `APP_URL` as a repository variable so the scheduled workflow can drive the job queue and digest.
4. Confirm AI drafting works before launch: `pnpm ai:check`. It exercises the real provider through the same validation gate the job uses and spends no credit. A 404 here means `OPENROUTER_MODEL_ID` is not a model the key can use.
5. Drafting is capped at 10 drafts per rolling 24 hours per account on top of the one-credit-per-draft model. The cap is enforced in `startGeneration` after the deterministic preflight checks, so a click that would have failed validation does not consume a daily slot.
6. Flip flags only after their gates: `FEATURE_AI_ENABLED` (AI terms + eval), `FEATURE_GMAIL_ENABLED` (Google verification), `FEATURE_LIVE_PURCHASES_ENABLED` (economics + legal), `FEATURE_RESUME_ATTACHMENTS_ENABLED` (scanner).
7. Run `docs/runbooks/deployment.md` with a real staging drill incl. restore + payment/Gmail reconciliation.
