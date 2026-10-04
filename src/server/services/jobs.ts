import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

/**
 * Job creation helper (§20.2 step 1): the domain transaction commits the job
 * row and its outbox event atomically. The dispatcher publishes after commit;
 * if publish fails the outbox remains retryable and the periodic sweep finds it.
 */
export type JobKind =
  | "resume.scan_parse"
  | "draft.generate"
  | "gmail.create_draft"
  | "gmail.reconcile"
  | "payment.fulfill"
  | "payment.reconcile"
  | "contacts.import_verify"
  | "privacy.export"
  | "privacy.delete"
  | "reminders.materialize"
  | "credits.reconcile"
  | "outbox.dispatch";

export async function enqueueJob(params: {
  kind: JobKind;
  userId?: string | null;
  entityId?: string | null;
  maxAttempts?: number;
  deadlineSeconds?: number;
  availableAfter?: Date;
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0];
}): Promise<string> {
  const executor = params.tx ?? db;
  // Deadlines are computed in JS — parameterized make_interval named args are
  // fragile across drivers.
  const deadline = params.deadlineSeconds
    ? new Date(Date.now() + params.deadlineSeconds * 1000).toISOString()
    : null;
  const rows = await executor.execute(sql`
    INSERT INTO jobs (kind, user_id, entity_id, max_attempts, deadline_at, available_after)
    VALUES (
      ${params.kind},
      ${params.userId ?? null}::uuid,
      ${params.entityId ?? null}::uuid,
      ${params.maxAttempts ?? 3},
      ${deadline}::timestamptz,
      ${(params.availableAfter ?? new Date()).toISOString()}::timestamptz
    )
    RETURNING id
  `);
  const jobId = (rows.rows[0] as { id: string }).id;
  await enqueueOutboxEvent({ kind: "job.dispatch", payload: { job_id: jobId }, tx: params.tx });
  return jobId;
}

export async function enqueueOutboxEvent(params: {
  kind: "job.dispatch" | "job.retry" | "payment.fulfill" | "notification.create";
  payload: Record<string, unknown>;
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0];
}): Promise<string> {
  const executor = params.tx ?? db;
  const rows = await executor.execute(sql`
    INSERT INTO outbox_events (kind, payload) VALUES (${params.kind}, ${JSON.stringify(params.payload)}::jsonb)
    RETURNING id
  `);
  return (rows.rows[0] as { id: string }).id;
}
