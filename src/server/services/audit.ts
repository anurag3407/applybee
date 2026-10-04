import "server-only";
import { db } from "@/db/client";
import { auditEvents } from "@/db/schema";
import { logger } from "@/server/logger";

/**
 * Append-only audit trail (§17.7). Records actor, permission, action, entity,
 * reason, and a safe request id. Never includes sensitive content.
 */
export async function audit(params: {
  actorType: "user" | "system" | "admin" | "worker";
  actorId?: string;
  permission?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}): Promise<void> {
  try {
    await db.insert(auditEvents).values({
      actorType: params.actorType,
      actorId: params.actorId,
      permission: params.permission,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      reason: params.reason,
      metadata: params.metadata ?? null,
      requestId: params.requestId,
    });
  } catch (err) {
    // Audit must never take down the request path, but failures are visible.
    logger.error("audit.write_failed", { action: params.action, error: String(err) });
  }
}
