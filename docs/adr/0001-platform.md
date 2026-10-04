# ADR 0001 — Platform, runtime, and dependency decisions

**Date:** 2026-10-04 · **Status:** accepted for this build

## Decision

- **Next.js 16.0.0** (App Router, Turbopack), React 19.2, TypeScript strict on Node 24 LTS, pnpm 10. The plan's 16.x baseline is honored; the build uses `output: "standalone"` for container deployment.
- **PostgreSQL 15/16 via Drizzle ORM + node-postgres** locally; production points `DATABASE_URL` at Neon Postgres. Financial multi-step transitions are audited SQL functions (`src/db/functions.sql`) executed in one transaction — never read/write sequences over HTTP.
- **One durable queue semantics implementation:** Postgres `jobs` + `outbox_events` with leases/fencing. Local runs an embedded worker (instrumentation) or `pnpm worker:dev`; production swaps the transport (SQS/Queues) without changing job correctness.
- **Adapters behind interfaces** (plan §6.2): object store (local FS ↔ S3/R2), draft model (labeled offline sample ↔ Gemini REST), Gmail gateway (mock ↔ live REST with a hard allowlist rejecting send paths), payments (labeled sandbox ↔ Razorpay REST), rate limiting (durable Postgres admission always; optional Upstash pre-check).
- **Motion:** GSAP + ScrollTrigger (marketing reveals), Lenis (marketing scroll only), CSS transitions for micro-feedback. Anime.js is included in the dependency set for app microfeedback but is not yet wired to a component — noted as remaining polish, deliberately not loaded per-route.
- **React Query omitted.** RSC + small polling hooks cover job polling and mutations; revisiting is cheap if cross-page cache invalidation demand emerges.

## Consequences

- Production adapters require credentials (see `.env.example`); config validation blocks dev adapters in `APP_ENV=production`.
- The embedded dev worker preserves outbox/idempotency semantics; no inline business-logic shortcut exists.

# ADR 0002 — Authentication (Clerk interface, labeled dev adapter)

**Status:** accepted for this build; production wiring pending credentials

The plan mandates Clerk. Without credentials, a Clerk build cannot run at all, so the app ships an auth **boundary** (`src/server/auth/session.ts`):

- `clerk` mode activates only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` exist; production with dev mode is refused at startup.
- `dev` mode is a labeled local session adapter (cookie + `auth_sessions`), signed-in surfaces disclose it, and it is never available in production.
- Provisioning is shared: `provision_user_and_trial` converges first-request and `POST /api/webhooks/clerk` (Svix-style HMAC + replay window implemented), trial entitlements key on a **verified-identity fingerprint** (HMAC of the email), and terminal tombstones prevent resurrection.
- Social login must be labeled “Continue with Google”, never “Connect Gmail”; Gmail authorization is a separate OAuth project (ADR 0003).

**Production wiring steps:** install `@clerk/nextjs`, wrap `layout.tsx` with `ClerkProvider`, replace `getSessionUser()` internals with `auth()` + user lookup by `clerk_id`, mount `<SignIn/>`/`<SignUp/>` inside the existing branded frames, and set the webhook secret. Everything downstream (roles, policies, provisioning) is unchanged.

# ADR 0003 — Gmail: draft-only enforcement and uncertainty handling

- Scope requested: `gmail.compose` (+ `openid email`) from a **dedicated** OAuth client; consent copy states plainly that the scope permits sending and that Apply Bee doesn’t send.
- `GmailDraftGateway` exposes create + bounded reconciliation only. `gmailFetch` enforces a regex allowlist (`/gmail/v1/users/me/drafts…`) and explicitly rejects any `send` path; a structural test asserts no exported symbol contains “send”.
- Approval stores an immutable hash of revision/mailbox-version/attachment; the delivery worker re-checks account status, connection version, recipient suppression (by fingerprint, covering manual copies), and attachment lifecycle immediately before dispatch; an attempt row with `call_started_at` is persisted **before** the network call.
- Lost responses become `unknown` → bounded marker-based reconciliation → `needs_confirmation`; recreation is explicit with a duplicate warning. No Redis lock or Message-ID claims exactly-once.
- Tokens: AES-256-GCM envelopes bound to connection id; refresh preserves existing refresh tokens; disconnect bumps connection version, invalidates approvals, and clears tokens.

# ADR 0004 — Credits, lots, and money correctness

- Balances are materialized `credit_accounts` rows; every movement appends a `credit_ledger_entries` row and updates per-lot quantities in the same transaction. Invariant: `granted = available + reserved + consumed + reversed` per lot, and account sums equal lot sums — checked by `verify_credit_consistency` (daily job + tests).
- Deterministic allocation: trial lots first, then paid by earliest expiry, grant time, id. Reservations allocate lots at reservation time.
- Reveal: contact row lock → existing-unlock check → account lock → recheck → debit → unique unlock → ledger → direct lot consumption. Concurrent calls converge on one charge (proven by a 20-way concurrent test).
- Generation: reserve (idempotent by operation ref) → worker → validated artifact + `complete_generation` (consume) atomically; permanent model failure releases exactly once; a release can never revive a consumed charge (tested).
- Payments: server-priced orders; webhook raw-body HMAC + durable event dedupe; `fulfill_captured_payment` grants at most once per payment (unique payment + purpose). Refund holds, proportional reversal rules, and debt records follow §21.5 when refunds are enabled.
- API idempotency: scoped `Idempotency-Key` + request hash; same key + different input → 409.

# ADR 0005 — File storage

- Three separated roots (quarantine / clean / export) behind one `ObjectStore` interface. Local adapter stores under `.data/private/*` (gitignored); production adapters for S3/R2 implement the same contract with IAM/R2 bindings.
- Server-generated keys only; final stored bytes are re-inspected (magic `%PDF`, `%%EOF`, `/Encrypt`, page count) — names and MIME headers are not trusted; envelope-encrypted contact emails use AAD binding the contact id.
- Downloads/attachments require `scanStatus='clean'`. The local scanner performs structural validation only and is disclosed in the UI; production attachment delivery requires the isolated document processor (launch gate).
