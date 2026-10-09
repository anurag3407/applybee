import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db/client";
import { notifications, opportunities, opportunityNotes } from "@/db/schema";
import { opportunitySchema, NOTE_MAX } from "@/lib/validation";
import { audit } from "@/server/services/audit";

/**
 * Opportunity pipeline (§12.5). Stages are updated by the user; draft
 * creation never implies applied_or_contacted. Follow-up reminders appear
 * in-app only — no automatic outreach.
 */

export type Stage = "interested" | "draft_ready" | "applied_or_contacted" | "conversation" | "interview" | "offer" | "closed";

export const STAGES: Array<{ key: Stage; label: string }> = [
  { key: "interested", label: "Interested" },
  { key: "draft_ready", label: "Draft ready" },
  { key: "applied_or_contacted", label: "Applied / Contacted" },
  { key: "conversation", label: "Conversation" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "closed", label: "Closed" },
];

export class OpportunityError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
  /** NOT_FOUND answers with the sentinel envelope; EMPTY_NOTE keeps the
   * generic 500 it has always had (its message is user copy, not a code). */
  apiErrorSpec() {
    if (this.code === "NOT_FOUND") {
      return { status: 404, code: "NOT_FOUND", message: "This opportunity no longer exists." };
    }
    return undefined;
  }
}

export async function listOpportunities(userId: string) {
  return db
    .select()
    .from(opportunities)
    .where(eq(opportunities.userId, userId))
    .orderBy(desc(opportunities.updatedAt))
    .limit(200);
}

export async function getOpportunity(userId: string, opportunityId: string) {
  const rows = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.userId, userId)))
    .limit(1);
  if (!rows[0]) return null;
  const notes = await db
    .select()
    .from(opportunityNotes)
    .where(eq(opportunityNotes.opportunityId, opportunityId))
    .orderBy(desc(opportunityNotes.createdAt))
    .limit(50);
  return { opportunity: rows[0], notes };
}

export async function createOpportunity(userId: string, input: z.infer<typeof opportunitySchema>): Promise<string> {
  const inserted = await db
    .insert(opportunities)
    .values({
      userId,
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      jobUrl: input.jobUrl || null,
      stage: input.stage ?? "interested",
      contactId: input.contactId ?? null,
      draftId: input.draftId ?? null,
      nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
      nextActionNote: input.nextActionNote,
      source: input.source,
    })
    .returning({ id: opportunities.id });
  return inserted[0]!.id;
}

export async function updateOpportunity(userId: string, opportunityId: string, input: Partial<z.infer<typeof opportunitySchema>>): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.stage !== undefined) patch.stage = input.stage;
  if (input.nextActionAt !== undefined) patch.nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : null;
  if (input.nextActionNote !== undefined) patch.nextActionNote = input.nextActionNote;
  if (input.contactId !== undefined) patch.contactId = input.contactId;
  if (input.draftId !== undefined) patch.draftId = input.draftId;
  if (input.jobUrl !== undefined) patch.jobUrl = input.jobUrl || null;
  const updated = await db
    .update(opportunities)
    .set(patch)
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.userId, userId)))
    .returning({ id: opportunities.id });
  if (updated.length === 0) throw new OpportunityError("NOT_FOUND", "Opportunity not found.");
  if (input.stage !== undefined) {
    await audit({ actorType: "user", actorId: userId, action: "opportunity.stage_changed", entityType: "opportunity", entityId: opportunityId, metadata: { stage: input.stage, selfReported: true } });
  }
}

export async function deleteOpportunity(userId: string, opportunityId: string): Promise<void> {
  await db.delete(opportunities).where(and(eq(opportunities.id, opportunityId), eq(opportunities.userId, userId)));
}

export async function addNote(userId: string, opportunityId: string, body: string): Promise<string> {
  const trimmed = body.trim().slice(0, NOTE_MAX);
  if (trimmed.length < 1) throw new OpportunityError("EMPTY_NOTE", "Write a note first.");
  const inserted = await db
    .insert(opportunityNotes)
    .values({ userId, opportunityId, body: trimmed })
    .returning({ id: opportunityNotes.id });
  await db.update(opportunities).set({ updatedAt: new Date() }).where(eq(opportunities.id, opportunityId));
  return inserted[0]!.id;
}

export async function upcomingReminders(userId: string) {
  return db
    .select({
      id: opportunities.id,
      companyName: opportunities.companyName,
      roleTitle: opportunities.roleTitle,
      nextActionAt: opportunities.nextActionAt,
      nextActionNote: opportunities.nextActionNote,
    })
    .from(opportunities)
    .where(and(eq(opportunities.userId, userId), sql`next_action_at IS NOT NULL AND next_action_at > now() - interval '1 day' AND stage <> 'closed'`))
    .orderBy(opportunities.nextActionAt)
    .limit(10);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function listNotifications(userId: string, limit = 30) {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), sql`dismissed_at IS NULL`))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT count(*)::int AS c FROM notifications
    WHERE user_id = ${userId}::uuid AND read_at IS NULL AND dismissed_at IS NULL
  `);
  return Number((rows.rows[0] as { c: number }).c);
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function dismissNotification(userId: string, notificationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ dismissedAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

