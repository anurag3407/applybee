# Apply Bee

**Get your work in front of the right people.** A career outreach workspace: find relevant hiring contacts, write truthful introductions grounded in confirmed facts, and prepare Gmail drafts you review — sending always stays with you.

This repository implements the complete product specified in [`plan.md`](./plan.md) (which supersedes [`PRD.md`](./PRD.md) on engineering conflicts).

## Quick start (local development)

Requirements: Node 24+, pnpm 10, PostgreSQL (local instance or Neon branch).

```bash
pnpm install
cp .env.example .env            # then set DATABASE_URL (and optional provider keys)
createdb applybee_dev           # or any Postgres database
pnpm db:migrate                 # applies committed migrations + audited SQL functions
pnpm db:seed:test               # fictional catalog/companies/contacts (reserved .example domains)
pnpm dev                        # http://localhost:3000
```

Sign in at `/sign-in` with any email — the labeled local development session adapter provisions the account and grants the free trial (5 contact reveals, 2 AI generations) exactly once per verified identity. No real external services are required:

- **AI** runs a clearly-labeled offline “Sample AI” until `GEMINI_API_KEY` + `GEMINI_MODEL_ID` are set.
- **Gmail** uses a labeled sandbox connection until Google OAuth credentials exist (draft-only; no send path exists anywhere).
- **Payments** use a labeled sandbox checkout until Razorpay keys exist; `FEATURE_LIVE_PURCHASES_ENABLED` stays `false` for real sales.

The durable job worker runs embedded in dev (`instrumentation.ts`); production runs it standalone (`pnpm worker:dev`).

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Official Next.js dev/production cycle |
| `pnpm typecheck` | Strict TypeScript, no emit |
| `pnpm test` | Unit + integration tests (integration uses `applybee_test` and applies the real migrations) |
| `pnpm db:migrate` | Apply committed migrations with the migration role |
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema |
| `pnpm db:seed:test` | Deterministic fictional seed (never production) |
| `pnpm worker:once` / `pnpm worker:dev` | Process bounded due jobs / long-running worker |

## Background jobs in production

Cloudflare Workers freeze between requests, so the in-process `setInterval`
worker loop from `src/instrumentation.ts` only works under `pnpm dev`. The
deployed worker has no timer of its own, and the OpenNext Cloudflare build does
not emit a `scheduled` handler — so **an external scheduler must drive the
queue**:

```
POST /api/v1/cron/run
Authorization: Bearer $CRON_SECRET
```

That call seeds the recurring housekeeping jobs, runs the recovery sweep,
drains due jobs and the outbox, and (during `CRON_DIGEST_HOUR_UTC`) sends the
daily hiring digest. It is safe to call frequently: jobs are claimed under
leases and the digest is claimed by a unique `(user_id, dispatch_date)` row
before any email is sent, so a repeated call cannot double-send.
`.github/workflows/scheduled-jobs.yml` runs it every 5 minutes; it needs the
`CRON_SECRET` repository secret and an `APP_URL` repository variable.

Secrets belong in `wrangler secret put <NAME>` — never in `wrangler.jsonc`.
`src/server/config.ts` refuses to boot in production when auth, the database,
or the token-encryption key are missing, and logs a loud summary for secrets
that only degrade a single feature.

## AI drafting

One copilot credit buys exactly one draft, and a credit is only consumed when a
validated artifact is durably saved — a failed generation releases it
automatically. Accepting a draft costs nothing extra. On top of that, drafting
is capped at **10 drafts per rolling 24 hours per account**, regardless of
balance, to bound provider spend.

Verify the provider end to end without spending a credit:

```
pnpm ai:check
```

It reports the resolved `aiMode` and model, calls the provider with a probe
prompt, and runs the result through the same `validateGroundedDraft` gate the
job uses — so a pass means drafting will work, and a failure names the cause
(missing key, unknown `OPENROUTER_MODEL_ID`, unreachable provider).

Provider selection in `src/server/config.ts` prefers Gemini when
`AI_PROVIDER=gemini` and a key is present, otherwise OpenRouter, otherwise a
clearly labeled offline sample model. Rate limits (5/min, 30/hour, 10/day) and
concurrency slots are defined in `src/server/adapters/ratelimit.ts`.

## What is enforced in code (not just policy)

- **Draft-only Gmail:** the HTTP allowlist inside the Gmail adapter rejects any send path; a structural test asserts no send capability is exported.
- **Transactional credits:** reveals, reservations, consumption, releases, and payment grants run as audited SQL functions with per-lot conservation (`granted = available + reserved + consumed + reversed`) verified by `verify_credit_consistency()` and concurrency tests (20 concurrent reveals → one debit; last-credit race; grant-exactly-once).
- **Private data:** contact emails are envelope-encrypted (AES-256-GCM, AAD-bound) and never serialized without an unlock; resumes live in separated quarantine/clean/export roots behind scan gates; private routes emit `private, no-store`.
- **Honest external states:** unknown Gmail outcomes reconcile instead of blind retry; delayed payments show “being confirmed” and grant exactly once regardless of how confirmation arrives.

## Documentation

- [`docs/implementation-status.md`](./docs/implementation-status.md) — milestone evidence and external launch gates
- [`docs/adr/0001-platform.md`](./docs/adr/0001-platform.md) — platform, auth, Gmail, credits, storage ADRs
- [`docs/runbooks/operations.md`](./docs/runbooks/operations.md) — deployment, payments/credits, Gmail uncertainty, queues/files, privacy, restore drill
- [`.env.example`](./.env.example) — full configuration inventory (names only; never commit credentials)
