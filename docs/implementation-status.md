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

1. **Auth adapter:** the plan mandates Clerk; this build ships the full app behind an adapter interface with a labeled local development session (production-blocked by config validation). Wiring steps in ADR 0002 — intentional per “keep incomplete external features behind honest flags”.
2. **React Query** (§5.1) intentionally omitted; server state via RSC + small polling hooks — fewer dependencies, same behavior. Documented in ADR 0001.
3. **Direct server-mediated uploads** locally (no presigned PUT without a real bucket); the storage adapter interface matches S3/R2 semantics for production.
4. **Embedded dev worker** via `instrumentation.ts` executes the same durable DB jobs with outbox/idempotency semantics; production runs the standalone worker (`pnpm worker:dev`) per runbook.
5. **Next.js 16** renamed `middleware.ts` → `proxy.ts` (adopted). Exact versions pinned in `package.json`.
6. Two real defects were caught and fixed during E2E verification: missing `setAuthTag` in envelope decryption, and a column-count bug in three credit ledger SQL functions — both now covered by tests.

## Operator checklist before enabling live capability

1. Set real credentials (`.env.example` inventory), set `APP_ENV=production`; config validation will refuse dev adapters.
2. Flip flags only after their gates: `FEATURE_AI_ENABLED` (AI terms + eval), `FEATURE_GMAIL_ENABLED` (Google verification), `FEATURE_LIVE_PURCHASES_ENABLED` (economics + legal), `FEATURE_RESUME_ATTACHMENTS_ENABLED` (scanner).
3. Run `docs/runbooks/deployment.md` with a real staging drill incl. restore + payment/Gmail reconciliation.
