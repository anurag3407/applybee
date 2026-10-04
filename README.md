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
