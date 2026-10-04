# Runbooks

## Deployment (production)

Reference path: **AWS ECS Fargate + standalone Next.js container** (plan §25). Nothing is provisioned yet; this is the ordered procedure.

1. Provision staging/production isolation (separate accounts or strict isolation), DNS/ACM, ECR, private S3 buckets (quarantine/clean/export), SQS queues + DLQs, EventBridge schedules, KMS/Secrets Manager entries.
2. Create Neon project + roles: `applybee_migrator` (DDL, CI only) and `applybee_runtime` (least privilege; no ALTER). Set `DATABASE_URL`/`DATABASE_MIGRATION_URL` in the secret manager.
3. Build images from `output: "standalone"` (multi-stage, nonroot); run lint/typecheck/tests + secret scan in CI; scan containers.
4. Apply migrations as a separate job with the migration role (`pnpm db:migrate` via `DATABASE_MIGRATION_URL`). Never `db push`, never migrate on request startup.
5. Deploy web service + worker service (`pnpm worker:dev` equivalent container with `APP_WORKER_EMBEDDED=false`) behind the ALB; authenticated routes and webhooks must never be shared-cached (headers already emit `private, no-store`).
6. Configure fixed callback/webhook URLs (Clerk, Google, Razorpay); arbitrary preview hosts must not reach OAuth callbacks.
7. Smoke-test: health endpoints, sign-in, manual save, masked directory, balances, sandbox→live provider modes per flag gates.

Rollback: keep previous task definition; flags (§28.5) disable new purchases/AI/Gmail/uploads without losing verified webhook ingestion or in-flight reconciliation. Ledger transactions are never reversed by deploys.

## Payments & credits

- **Captured but unfulfilled > 5 min:** check `jobs` (payment.fulfill) and `webhook_events.process_state`; requeue via the same idempotent service — never insert grants manually.
- **Double-grant suspicion (grant_count ≠ 1):** treat as critical — disable affected credit mutations, reconcile from provider records, correct via compensating ledger entries with an audit reason.
- **User reports wrong charge:** verify `credit_ledger_entries` for the operation ref; adjustments go through audited grant/compensation entries, never direct balance edits.
- **Refunds (when enabled):** hold refundable quantities (refund-hold reservations), call provider, settle `refunds` exactly once by provider refund id; unknown outcome keeps the hold pending reconciliation.

## Gmail uncertainty

- **`unknown` state:** worker schedules `gmail.reconcile`; operator may trigger bounded reconcile via admin. Never bulk-recreate. If unresolved >10 min the delivery becomes `needs_confirmation`; the user decides with an explicit duplicate warning.
- **Connection revoked mid-flight:** deliveries gate on connection version pre-dispatch; blocked ones show actionable copy (“Gmail needs to be reconnected. Your draft is still saved here.”).
- **Token/refresh incidents:** rotate `TOKEN_ENCRYPTION_KEY` via key versioning; re-connect required after revoke. Rotation drill: verify old envelopes fail closed with actionable copy, not silent data loss.

## Queues & files

- **Queue outage:** jobs remain durable in Postgres; the dispatcher sweep picks them up after recovery. Outbox events marked pending retry with backoff.
- **Expired leases:** recovery sweep requeues `running` jobs past lease expiry; fencing tokens make stale completions no-ops. A recovered Gmail attempt with `call_started_at` routes to reconciliation, never recreation.
- **Scanner unavailable:** uploads remain quarantined (`scanStatus='unavailable'`); attachment selection/download stays blocked; retries are bounded.
- **Stale reservations:** the credits.reconcile sweeper releases only when no runnable job can still consume (deadline alone is never sufficient).

## Privacy

- **Export:** `POST /api/v1/privacy {action:"export"}` → durable job → JSON archive in the export bucket, 24 h availability. One per day per user.
- **Deletion:** account → `deleting` immediately (blocks purchases/generation/delivery); job removes files + derived content; financial/audit records retained per policy, pseudonymized; Clerk tombstone prevents webhook resurrection. Restored backups must reapply deletion/suppression tombstones before serving traffic.
- **Contact-data requests (no account):** `/contact-data/request` → `contact_reports`; resolution = suppression with scope (directory-only vs delivery-wide) + audited decision.

## Restore drill (quarterly, before enabling live money features)

Freeze billing/AI/Gmail → restore DB to isolated env → reapply tombstones → reconcile captures/refunds against Razorpay → classify pre-restore in-flight Gmail calls as uncertain → verify `verify_credit_consistency()` = 0 → staged re-enable. Per §28.7, a 15-minute RPO loses post-checkpoint writes: keep an independent recovery journal for critical operations before enabling real money/external effects.
