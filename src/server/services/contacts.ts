import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { companies, contactReports, contactUnlockss, contacts, savedContacts, companyEvidence } from "@/db/schema";
import { decryptEnvelope, emailFingerprint } from "@/server/crypto";
import { revealContact } from "@/server/services/credits";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { withIdempotency, hashRequest } from "@/server/services/idempotency";
import { audit } from "@/server/services/audit";
import { CreditError } from "@/server/services/credits";

/**
 * Directory service (§12.3, §12.4). Locked emails are absent from every
 * serialized response; reveal is atomic and converges on one charge.
 */

export type DirectoryFilters = {
  q?: string;
  department?: string;
  roleCategory?: string;
  location?: string;
  stage?: string;
  verification?: string;
  cursor?: string;
  pageSize?: number;
};

export type DirectoryRow = {
  id: string;
  name: string;
  title: string;
  roleCategory: string;
  department: string;
  location: string | null;
  companyName: string;
  companyDomain: string;
  companyStage: string | null;
  verificationStatus: string;
  status: string;
  lastEmailCheckedAt: Date | null;
  employmentCheckedAt: Date | null;
  isHiringManager: boolean;
  unlocked: boolean;
  saved: boolean;
  maskedEmail: string;
};

export async function searchDirectory(userId: string, filters: DirectoryFilters): Promise<{ rows: DirectoryRow[]; nextCursor: string | null }> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 5), 100);
  const params: unknown[] = [];
  const where: string[] = [`c.status IN ('active','stale')`];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(c.name ILIKE $${params.length} OR c.title ILIKE $${params.length} OR co.name ILIKE $${params.length})`);
  }
  if (filters.department) {
    params.push(filters.department);
    where.push(`c.department = $${params.length}`);
  }
  if (filters.roleCategory) {
    params.push(filters.roleCategory);
    where.push(`c.role_category = $${params.length}`);
  }
  if (filters.location) {
    params.push(`%${filters.location}%`);
    where.push(`c.location ILIKE $${params.length}`);
  }
  if (filters.stage) {
    params.push(filters.stage);
    where.push(`co.stage = $${params.length}`);
  }
  if (filters.verification) {
    params.push(filters.verification);
    where.push(`c.verification_status = $${params.length}`);
  }

  // Keyset pagination with deterministic tie-breaker (id).
  let cursorClause = "";
  if (filters.cursor) {
    const [ts, id] = filters.cursor.split("|");
    if (ts && id) {
      params.push(new Date(ts).toISOString(), id);
      where.push(`(c.updated_at, c.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
  }
  params.push(userId);
  const userParam = params.length;
  params.push(pageSize + 1);
  const sizeParam = params.length;

  // Parameterized query through the pool (sql.raw cannot bind values).
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.title, c.role_category, c.department, c.location, c.verification_status, c.status,
           c.last_email_checked_at, c.employment_checked_at, c.is_hiring_manager,
           co.name AS company_name, co.domain AS company_domain, co.stage AS company_stage,
           cu.id IS NOT NULL AS unlocked, sv.id IS NOT NULL AS saved
    FROM contacts c
    JOIN companies co ON co.id = c.company_id
    LEFT JOIN contact_unlocks cu ON cu.contact_id = c.id AND cu.user_id = $${userParam}::uuid
    LEFT JOIN saved_contacts sv ON sv.contact_id = c.id AND sv.user_id = $${userParam}::uuid
    WHERE ${where.join(" AND ")}
    ORDER BY c.updated_at DESC, c.id DESC
    LIMIT $${sizeParam}
  `, params);
  const mapped: DirectoryRow[] = rows.slice(0, pageSize).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    title: r.title as string,
    roleCategory: r.role_category as string,
    department: (r.department as string) ?? "engineering",
    location: (r.location as string) ?? null,
    companyName: r.company_name as string,
    companyDomain: r.company_domain as string,
    companyStage: (r.company_stage as string) ?? null,
    verificationStatus: r.verification_status as string,
    status: r.status as string,
    lastEmailCheckedAt: (r.last_email_checked_at as Date) ?? null,
    employmentCheckedAt: (r.employment_checked_at as Date) ?? null,
    isHiringManager: Boolean(r.is_hiring_manager),
    unlocked: Boolean(r.unlocked),
    saved: Boolean(r.saved),
    maskedEmail: maskEmailForDisplay(r.company_domain as string),
  }));
  let nextCursor: string | null = null;
  if (rows.length > pageSize && mapped.length > 0) {
    const last = rows[pageSize - 1]!;
    nextCursor = `${new Date(last.updated_at as Date).toISOString()}|${last.id as string}`;
  }
  return { rows: mapped, nextCursor };
}

/** Masked preview built from the company domain only — never the real local part. */
function maskEmailForDisplay(domain: string): string {
  return `•••@${domain}`;
}

export async function getContactForUser(userId: string, contactId: string) {
  const rows = await db
    .select({
      contact: contacts,
      companyName: companies.name,
      companyDomain: companies.domain,
      companyStage: companies.stage,
      companyDescription: companies.description,
    })
    .from(contacts)
    .innerJoin(companies, eq(companies.id, contacts.companyId))
    .where(eq(contacts.id, contactId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const unlock = await db
    .select({ id: contactUnlockss.id, unlockedAt: contactUnlockss.unlockedAt })
    .from(contactUnlockss)
    .where(and(eq(contactUnlockss.userId, userId), eq(contactUnlockss.contactId, contactId)))
    .limit(1);
  const saved = await db
    .select({ id: savedContacts.id })
    .from(savedContacts)
    .where(and(eq(savedContacts.userId, userId), eq(savedContacts.contactId, contactId)))
    .limit(1);

  const unlocked = unlock.length > 0;
  return {
    ...row.contact,
    companyName: row.companyName,
    companyDomain: row.companyDomain,
    companyStage: row.companyStage,
    companyDescription: row.companyDescription,
    unlocked,
    unlockedAt: unlocked ? unlock[0]!.unlockedAt : null,
    saved: saved.length > 0,
    // Email only leaves the server when an unlock exists (§3.2).
    email: unlocked && row.contact.emailEnc ? decryptEnvelope(row.contact.emailEnc, `contact:${row.contact.id}`) : null,
    maskedEmail: maskEmailForDisplay(row.companyDomain),
  };
}

export class RevealError extends Error {
  code: string;
  retryAfter?: number;
  constructor(code: string, message: string, retryAfter?: number) {
    super(message);
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export async function revealContactForUser(params: {
  userId: string;
  contactId: string;
  idempotencyKey: string;
}): Promise<{ email: string; alreadyUnlocked: boolean; charged: boolean }> {
  // Rate limit: first-reveal requests 20/min per user (§22.2).
  const admission = await admitWithPreCheck({
    policy: LIMITS.reveal,
    principal: params.userId,
    operationRef: `reveal:${params.userId}:${params.idempotencyKey}`,
  });
  if (!admission.admitted) {
    throw new RevealError("RATE_LIMITED", "Too many reveal attempts. Please wait a moment.", admission.retryAfterSeconds);
  }

  const outcome = await withIdempotency<{ email: string; alreadyUnlocked: boolean; charged: boolean }>({
    actorId: params.userId,
    scope: "contact.reveal",
    key: params.idempotencyKey,
    requestHash: hashRequest({ contactId: params.contactId }),
    run: async (operationRef) => {
      const result = await revealContact({
        userId: params.userId,
        contactId: params.contactId,
        operationRef,
      });
      await audit({
        actorType: "user",
        actorId: params.userId,
        action: "contact.revealed",
        entityType: "contact",
        entityId: params.contactId,
        metadata: { charged: result.charged },
      });
      const contact = (await db.select().from(contacts).where(eq(contacts.id, params.contactId)).limit(1))[0];
      const email = contact?.emailEnc ? decryptEnvelope(contact.emailEnc, `contact:${contact.id}`) : "";
      return { email, alreadyUnlocked: result.alreadyUnlocked, charged: result.charged };
    },
  });

  if (outcome.kind === "conflict") {
    throw new RevealError("IDEMPOTENCY_CONFLICT", "This reveal request was already used with different inputs.");
  }
  if (outcome.kind === "new") return outcome.result;
  const value = outcome.responseMeta;
  if (value) return value;
  // Replay with no stored meta (older record): resolve through the unlock.
  const contact = (await db.select().from(contacts).where(eq(contacts.id, params.contactId)).limit(1))[0];
  if (!contact) throw new RevealError("CONTACT_NOT_FOUND", "This contact is no longer in the directory.");
  const unlock = await db
    .select({ id: contactUnlockss.id })
    .from(contactUnlockss)
    .where(and(eq(contactUnlockss.userId, params.userId), eq(contactUnlockss.contactId, params.contactId)))
    .limit(1);
  if (unlock.length === 0) {
    // Idempotent replay race: the operation ref exists but the unlock landed
    // under a different ref. Fall through to a fresh reveal — uniqueness of
    // user+contact guarantees no second debit.
    const result = await revealContact({ userId: params.userId, contactId: params.contactId, operationRef: crypto.randomUUID() });
    return {
      email: contact.emailEnc ? decryptEnvelope(contact.emailEnc, `contact:${contact.id}`) : "",
      alreadyUnlocked: result.alreadyUnlocked,
      charged: result.charged,
    };
  }
  return { email: contact.emailEnc ? decryptEnvelope(contact.emailEnc, `contact:${contact.id}`) : "", alreadyUnlocked: true, charged: false };
}

export async function saveContact(userId: string, contactId: string) {
  await db.insert(savedContacts).values({ userId, contactId }).onConflictDoNothing();
}

export async function unsaveContact(userId: string, contactId: string) {
  await db.delete(savedContacts).where(and(eq(savedContacts.userId, userId), eq(savedContacts.contactId, contactId)));
}

export async function listSavedContacts(userId: string) {
  const rows = await db
    .select({
      savedId: savedContacts.id,
      savedAt: savedContacts.savedAt,
      notes: savedContacts.notes,
      tags: savedContacts.tags,
      contactId: contacts.id,
      name: contacts.name,
      title: contacts.title,
      verificationStatus: contacts.verificationStatus,
      contactStatus: contacts.status,
      companyName: companies.name,
      companyDomain: companies.domain,
    })
    .from(savedContacts)
    .innerJoin(contacts, eq(contacts.id, savedContacts.contactId))
    .innerJoin(companies, eq(companies.id, contacts.companyId))
    .where(eq(savedContacts.userId, userId))
    .orderBy(desc(savedContacts.savedAt));
  return rows.map((r) => ({
    ...r,
    // Removed contacts stay as respectful tombstones (§12.4).
    tombstone: r.contactStatus === "removed" || r.contactStatus === "suppressed",
  }));
}

export async function updateSavedContact(userId: string, contactId: string, patch: { notes?: string; tags?: string[] }) {
  await db
    .update(savedContacts)
    .set({
      ...(patch.notes !== undefined ? { notes: patch.notes.slice(0, 2000) } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags.slice(0, 10) } : {}),
    })
    .where(and(eq(savedContacts.userId, userId), eq(savedContacts.contactId, contactId)));
}

export async function reportContact(params: {
  userId: string | null;
  contactId: string | null;
  email?: string;
  reportType: "stale" | "incorrect" | "removal" | "abuse";
  details: string;
}) {
  await db.insert(contactReports).values({
    reporterUserId: params.userId,
    contactId: params.contactId,
    emailFingerprint: params.email ? emailFingerprint(params.email) : null,
    reportType: params.reportType,
    details: params.details.slice(0, 2000),
  });
}

export async function getCompanyWithEvidence(companyId: string) {
  const company = (await db.select().from(companies).where(eq(companies.id, companyId)).limit(1))[0];
  if (!company) return null;
  const evidence = await db
    .select()
    .from(companyEvidence)
    .where(and(eq(companyEvidence.companyId, companyId), eq(companyEvidence.approval, "approved")))
    .orderBy(desc(companyEvidence.checkedAt));
  const contactRows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      title: contacts.title,
      verificationStatus: contacts.verificationStatus,
    })
    .from(contacts)
    .where(and(eq(contacts.companyId, companyId), eq(contacts.status, "active")))
    .orderBy(asc(contacts.name));
  return { company, evidence, contacts: contactRows };
}

export { CreditError };
