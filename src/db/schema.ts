/**
 * Apply Bee database schema (plan §17).
 *
 * Principles: normalized relations for durable business state; versioned JSONB
 * only for bounded structured extraction/model metadata; all user-owned tables
 * carry user_id + lifecycle timestamps. Money is integer paise; credits are
 * integer quantities; timestamps are timestamptz UTC.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Identity and preferences (§17.2)                                    */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // External authentication subject (Clerk user id, or `dev:<uuid>` for the
    // labeled local development session adapter).
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    status: text("status").notNull().default("active").$type<"active" | "disabled" | "deleting" | "deleted">(),
    onboardingStep: text("onboarding_step").notNull().default("profile"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_clerk_id_key").on(t.clerkId),
    check(
      "users_status_check",
      sql`${t.status} in ('active','disabled','deleting','deleted')`,
    ),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("auth_sessions_token_hash_key").on(t.tokenHash)],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    targetRoles: jsonb("target_roles").notNull().default(sql`'[]'::jsonb`),
    targetLocations: jsonb("target_locations").notNull().default(sql`'[]'::jsonb`),
    careerStage: text("career_stage"),
    locale: text("locale").notNull().default("en-IN"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    defaultMode: text("default_mode").notNull().default("manual").$type<"manual" | "quick_ai" | "agentic">(),
    defaultTone: text("default_tone").notNull().default("warm_professional"),
    notifyReminders: boolean("notify_reminders").notNull().default(true),
    notifyProduct: boolean("notify_product").notNull().default(false),
    dailyDigestEnabled: boolean("daily_digest_enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    assignedBy: uuid("assigned_by"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_role_assignments_user_role_key").on(t.userId, t.role)],
);

/** Anti-abuse tombstone independent of deletable user rows (§17.2). */
export const trialEntitlements = pgTable(
  "trial_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: text("program_id").notNull().default("free_trial_v1"),
    // Keyed fingerprint of a provider-verified identity (HMAC of verified email).
    identityFingerprint: text("identity_fingerprint").notNull(),
    decision: text("decision").notNull().default("eligible").$type<"eligible" | "blocked">(),
    policyVersion: text("policy_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("trial_entitlements_program_identity_key").on(t.programId, t.identityFingerprint),
  ],
);

export const trialGrants = pgTable(
  "trial_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    programId: text("program_id").notNull().default("free_trial_v1"),
    entitlementId: uuid("entitlement_id")
      .notNull()
      .references(() => trialEntitlements.id),
    policyVersion: text("policy_version").notNull(),
    grantRef: text("grant_ref").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("trial_grants_user_program_key").on(t.userId, t.programId)],
);

export const oauthStates = pgTable(
  "oauth_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateHash: text("state_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nonceHash: text("nonce_hash").notNull(),
    verifierEncrypted: text("verifier_encrypted"),
    returnPath: text("return_path").notNull().default("/app/settings/integrations"),
    intent: text("intent").notNull().default("connect"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("oauth_states_state_hash_key").on(t.stateHash)],
);

export const gmailConnections = pgTable(
  "gmail_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleSubject: text("google_subject").notNull(),
    googleEmail: text("google_email").notNull(),
    scopes: jsonb("scopes").notNull().default(sql`'[]'::jsonb`),
    // AES-256-GCM envelope binding user/connection id; key versioned.
    tokenEnvelopeEnc: text("token_envelope_enc"),
    tokenKeyVersion: integer("token_key_version"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    status: text("status").notNull().default("active").$type<"active" | "incomplete" | "revoked" | "expired">(),
    version: integer("version").notNull().default(1),
    refreshLeaseOwner: text("refresh_lease_owner"),
    refreshLeaseExpiresAt: timestamp("refresh_lease_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One active connection per user initially (§17.2).
    uniqueIndex("gmail_connections_user_active_key")
      .on(t.userId)
      .where(sql`status = 'active'`),
    index("gmail_connections_user_idx").on(t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Candidate and files (§17.3)                                         */
/* ------------------------------------------------------------------ */

export const uploadIntents = pgTable(
  "upload_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("resume"),
    objectKey: text("object_key").notNull(),
    maxBytes: bigint("max_bytes", { mode: "number" }).notNull(),
    state: text("state").notNull().default("pending").$type<"pending" | "uploaded" | "finalized" | "expired" | "failed">(),
    expectedMeta: jsonb("expected_meta"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("upload_intents_user_idx").on(t.userId, t.createdAt)],
);

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    objectVersion: text("object_version"),
    displayFilename: text("display_filename").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }).notNull(),
    sha256: text("sha256").notNull(),
    mimeType: text("mime_type").notNull().default("application/pdf"),
    pageCount: integer("page_count"),
    scanStatus: text("scan_status").notNull().default("pending").$type<"pending" | "clean" | "rejected" | "unavailable">(),
    scanVersion: text("scan_version"),
    scannedAt: timestamp("scanned_at", { withTimezone: true }),
    scanNote: text("scan_note"),
    parserVersion: text("parser_version"),
    parseState: text("parse_state").notNull().default("pending").$type<"pending" | "parsed" | "low_text" | "failed">(),
    state: text("state").notNull().default("uploaded").$type<
      "upload_pending" | "uploaded" | "scanning" | "scan_clean" | "scanning_rejected" | "parsing" | "review_required" | "ready" | "parse_failed" | "failed" | "deleting" | "deleted"
    >(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("resumes_user_idx").on(t.userId, t.createdAt),
    check("resumes_byte_size_positive", sql`${t.byteSize} > 0`),
  ],
);

export const candidateProfiles = pgTable(
  "candidate_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentRevisionId: uuid("current_revision_id"),
    activeResumeId: uuid("active_resume_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("candidate_profiles_user_key").on(t.userId)],
);

export const candidateProfileRevisions = pgTable(
  "candidate_profile_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: "cascade" }),
    revisionNo: integer("revision_no").notNull(),
    source: text("source").notNull().$type<"resume" | "manual">(),
    resumeId: uuid("resume_id"),
    extracted: jsonb("extracted"),
    contentHash: text("content_hash").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("candidate_profile_revisions_no_key").on(t.profileId, t.revisionNo)],
);

export const candidateFacts = pgTable(
  "candidate_facts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileRevisionId: uuid("profile_revision_id")
      .notNull()
      .references(() => candidateProfileRevisions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    factType: text("fact_type").notNull().$type<
      "experience" | "project" | "education" | "skill" | "achievement" | "link" | "summary"
    >(),
    text: text("text").notNull(),
    sourceRef: text("source_ref"),
    approved: boolean("approved").notNull().default(false),
    numericValue: integer("numeric_value"),
    unit: text("unit"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("candidate_facts_revision_idx").on(t.profileRevisionId)],
);

/* ------------------------------------------------------------------ */
/* Directory and provenance (§17.4)                                    */
/* ------------------------------------------------------------------ */

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    location: text("location"),
    stage: text("stage").$type<"tier1" | "unicorn" | "growth" | "startup">(),
    category: text("category"),
    description: text("description"),
    status: text("status").notNull().default("active").$type<"active" | "hidden">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("companies_domain_key").on(t.domain)],
);

export const companyEvidence = pgTable(
  "company_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    factType: text("fact_type").notNull().$type<"focus" | "stack" | "hiring_note" | "product" | "scale" | "news">(),
    value: text("value").notNull(),
    sourceUrl: text("source_url"),
    sourceName: text("source_name"),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rightsBasis: text("rights_basis").notNull().default("licensed"),
    approval: text("approval").notNull().default("approved").$type<"approved" | "pending" | "rejected">(),
    confidence: text("confidence").notNull().default("medium").$type<"high" | "medium" | "low">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("company_evidence_company_idx").on(t.companyId)],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title").notNull(),
    roleCategory: text("role_category").notNull().$type<
      "engineering_manager" | "tech_lead" | "vp_engineering" | "recruiter" | "founder" | "other"
    >(),
    department: text("department").notNull().default("engineering").$type<
      "engineering" | "design" | "content" | "sales" | "product_ops"
    >(),
    location: text("location"),
    profileUrl: text("profile_url"),
    // Work email protected at rest (envelope encryption); never serialized
    // unless the requesting user holds an unlock.
    emailEnc: text("email_enc"),
    emailFingerprint: text("email_fingerprint").notNull(),
    emailDomain: text("email_domain").notNull(),
    status: text("status").notNull().default("active").$type<"active" | "stale" | "suppressed" | "removed">(),
    verificationStatus: text("verification_status").notNull().default("unknown").$type<
      "verified" | "catch_all" | "unknown" | "invalid"
    >(),
    lastEmailCheckedAt: timestamp("last_email_checked_at", { withTimezone: true }),
    employmentCheckedAt: timestamp("employment_checked_at", { withTimezone: true }),
    isHiringManager: boolean("is_hiring_manager").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("contacts_email_fingerprint_key").on(t.emailFingerprint),
    index("contacts_directory_idx").on(t.status, t.roleCategory, t.location, t.companyId, t.id),
    index("contacts_dept_idx").on(t.status, t.department, t.location, t.id),
    // The directory sorts and keyset-paginates on (updated_at, id); without this
    // every page turn sorted the whole filtered set.
    index("contacts_updated_idx").on(t.updatedAt, t.id),
    index("contacts_name_trgm_idx").using("gin", sql`name gin_trgm_ops`),
  ],
);

export const contactSources = pgTable(
  "contact_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    sourceUri: text("source_uri"),
    licenseRef: text("license_ref"),
    collectionDate: timestamp("collection_date", { withTimezone: true }),
    permittedUses: text("permitted_uses"),
    retention: text("retention"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contact_sources_contact_idx").on(t.contactId)],
);

export const contactVerifications = pgTable(
  "contact_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    method: text("method").notNull(),
    provider: text("provider"),
    result: text("result").notNull().$type<"verified" | "catch_all" | "unknown" | "invalid">(),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
    evidenceMeta: jsonb("evidence_meta"),
  },
  (t) => [index("contact_verifications_contact_idx").on(t.contactId, t.checkedAt)],
);

export const contactSuppressions = pgTable(
  "contact_suppressions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailFingerprint: text("email_fingerprint").notNull(),
    contactId: uuid("contact_id"),
    scope: text("scope").notNull().default("delivery_wide").$type<"directory_only" | "delivery_wide">(),
    reason: text("reason").notNull(),
    state: text("state").notNull().default("active").$type<"active" | "resolved">(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("contact_suppressions_fingerprint_active_key")
      .on(t.emailFingerprint)
      .where(sql`state = 'active'`),
  ],
);

export const contactUnlockss = pgTable(
  "contact_unlocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    // Ledger entry reference for the single reveal consumption.
    consumptionRef: uuid("consumption_ref").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
    contactVersion: integer("contact_version").notNull().default(1),
  },
  (t) => [
    uniqueIndex("contact_unlocks_user_contact_key").on(t.userId, t.contactId),
    index("contact_unlocks_user_idx").on(t.userId, t.unlockedAt),
    index("contact_unlocks_contact_idx").on(t.contactId),
  ],
);

export const savedContacts = pgTable(
  "saved_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
    notes: text("notes"),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("saved_contacts_user_contact_key").on(t.userId, t.contactId)],
);

/* ------------------------------------------------------------------ */
/* Hiring posts feed & daily digest                                   */
/* ------------------------------------------------------------------ */

export const hiringPosts = pgTable(
  "hiring_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    companyName: text("company_name").notNull(),
    location: text("location"),
    roleCategory: text("role_category").notNull().default("engineering"),
    department: text("department").notNull().default("engineering"),
    sourcePlatform: text("source_platform").notNull().default("reachbee"),
    sourceUrl: text("source_url"),
    postSnippet: text("post_snippet").notNull(),
    techStack: jsonb("tech_stack").notNull().default(sql`'[]'::jsonb`),
    hiringManagerName: text("hiring_manager_name"),
    hiringManagerTitle: text("hiring_manager_title"),
    status: text("status").notNull().default("active").$type<"active" | "archived">(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("hiring_posts_status_posted_idx").on(t.status, t.postedAt),
    index("hiring_posts_role_idx").on(t.roleCategory, t.status),
  ],
);

export const digestDispatches = pgTable(
  "digest_dispatches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dispatchDate: text("dispatch_date").notNull(),
    postIds: jsonb("post_ids").notNull().default(sql`'[]'::jsonb`),
    emailId: text("email_id"),
    // "pending" is the claim marker: the row is written before the email is
    // sent so a concurrent run cannot double-send, and is updated to "sent"
    // (or deleted, to release the claim) once the outcome is known.
    status: text("status")
      .notNull()
      .default("sent")
      .$type<"sent" | "failed" | "skipped" | "pending">(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("digest_dispatches_user_date_key").on(t.userId, t.dispatchDate),
    index("digest_dispatches_user_idx").on(t.userId, t.dispatchedAt),
  ],
);

export const contactReports = pgTable(
  "contact_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterUserId: uuid("reporter_user_id"),
    contactId: uuid("contact_id"),
    emailFingerprint: text("email_fingerprint"),
    reportType: text("report_type").notNull().$type<"stale" | "incorrect" | "removal" | "abuse">(),
    details: text("details"),
    proofContact: text("proof_contact"),
    state: text("state").notNull().default("open").$type<"open" | "in_review" | "resolved" | "rejected">(),
    resolution: text("resolution"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("contact_reports_state_idx").on(t.state, t.createdAt)],
);

export const importRuns = pgTable("import_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  operatorId: uuid("operator_id").notNull(),
  sourceName: text("source_name").notNull(),
  licenseRef: text("license_ref").notNull(),
  fileRef: text("file_ref"),
  mode: text("mode").notNull().default("dry_run").$type<"dry_run" | "commit">(),
  status: text("status").notNull().default("pending").$type<"pending" | "running" | "completed" | "failed">(),
  totalRows: integer("total_rows").notNull().default(0),
  errorRows: integer("error_rows").notNull().default(0),
  insertedRows: integer("inserted_rows").notNull().default(0),
  skippedRows: integer("skipped_rows").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const importRows = pgTable(
  "import_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => importRuns.id, { onDelete: "cascade" }),
    rowIndex: integer("row_index").notNull(),
    normalizedKey: text("normalized_key"),
    outcome: text("outcome").notNull().$type<"would_insert" | "inserted" | "duplicate" | "error" | "suppressed">(),
    errorCode: text("error_code"),
    message: text("message"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [index("import_rows_run_idx").on(t.runId, t.rowIndex)],
);

/* ------------------------------------------------------------------ */
/* Drafts and opportunities (§17.5)                                    */
/* ------------------------------------------------------------------ */

export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: text("mode").notNull().default("manual").$type<"manual" | "quick_ai" | "agentic">(),
    intent: text("intent").notNull().default("intro").$type<
      "advertised_role" | "internship" | "intro" | "referral" | "follow_up"
    >(),
    contactId: uuid("contact_id"),
    // Own recipient is private draft data, never added to the directory.
    ownRecipientEmail: text("own_recipient_email"),
    ownRecipientName: text("own_recipient_name"),
    opportunityId: uuid("opportunity_id"),
    currentRevisionId: uuid("current_revision_id"),
    currentVersion: integer("current_version").notNull().default(0),
    status: text("status").notNull().default("active").$type<
      "active" | "generating" | "deleting" | "deleted"
    >(),
    // Denormalized from the current revision for list rendering only.
    listSubject: text("list_subject"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("drafts_user_updated_idx").on(t.userId, t.updatedAt, t.id),
    check("drafts_recipient_rule", sql`${t.contactId} is null or ${t.ownRecipientEmail} is null`),
  ],
);

export const draftRevisions = pgTable(
  "draft_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    revisionNo: integer("revision_no").notNull(),
    subject: text("subject").notNull().default(""),
    body: text("body").notNull().default(""),
    recipientSnapshot: jsonb("recipient_snapshot"),
    resumeId: uuid("resume_id"),
    profileRevisionId: uuid("profile_revision_id"),
    generationId: uuid("generation_id"),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("draft_revisions_draft_no_key").on(t.draftId, t.revisionNo)],
);

export const generationRequests = pgTable(
  "generation_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    mode: text("mode").notNull().$type<"quick_ai" | "agentic">(),
    intent: text("intent").notNull(),
    baseRevisionId: uuid("base_revision_id"),
    baseVersion: integer("base_version").notNull(),
    inputSnapshot: jsonb("input_snapshot").notNull(),
    inputHash: text("input_hash").notNull(),
    reservationId: uuid("reservation_id"),
    promptVersion: text("prompt_version"),
    modelId: text("model_id"),
    state: text("state").notNull().default("reserved").$type<
      "reserved" | "queued" | "preparing" | "generating" | "validating" | "ready" | "failed" | "released" | "cancelled"
    >(),
    proposedRevisionId: uuid("proposed_revision_id"),
    acceptanceState: text("acceptance_state").notNull().default("pending").$type<"pending" | "accepted" | "dismissed" | "expired">(),
    usage: jsonb("usage"),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("generation_requests_draft_idx").on(t.draftId, t.createdAt),
    index("generation_requests_state_idx").on(t.state),
  ],
);

export const draftClaims = pgTable(
  "draft_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => draftRevisions.id, { onDelete: "cascade" }),
    excerpt: text("excerpt").notNull(),
    factIds: jsonb("fact_ids").notNull().default(sql`'[]'::jsonb`),
    evidenceIds: jsonb("evidence_ids").notNull().default(sql`'[]'::jsonb`),
    validationResult: text("validation_result").notNull().default("supported").$type<"supported" | "unsupported" | "uncertain">(),
  },
  (t) => [index("draft_claims_revision_idx").on(t.revisionId)],
);

export const draftApprovals = pgTable(
  "draft_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => draftRevisions.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => gmailConnections.id),
    connectionVersion: integer("connection_version").notNull(),
    recipientFingerprint: text("recipient_fingerprint").notNull(),
    attachmentResumeId: uuid("attachment_resume_id"),
    attachmentSha256: text("attachment_sha256"),
    approvalHash: text("approval_hash").notNull(),
    state: text("state").notNull().default("active").$type<"active" | "consumed" | "invalidated">(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
  },
  (t) => [index("draft_approvals_draft_idx").on(t.draftId, t.approvedAt)],
);

export const gmailDeliveries = pgTable(
  "gmail_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    revisionId: uuid("revision_id").notNull(),
    approvalId: uuid("approval_id").notNull(),
    connectionId: uuid("connection_id").notNull(),
    connectionVersion: integer("connection_version").notNull(),
    approvalHash: text("approval_hash").notNull(),
    // Opaque reconciliation marker header; no PII.
    operationMarker: text("operation_marker").notNull(),
    state: text("state").notNull().default("queued").$type<
      "queued" | "preparing" | "calling_provider" | "created" | "known_failed" | "unknown" | "reconciling" | "needs_confirmation" | "blocked" | "cancelled"
    >(),
    providerDraftId: text("provider_draft_id"),
    providerMessageId: text("provider_message_id"),
    unknownSince: timestamp("unknown_since", { withTimezone: true }),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("gmail_deliveries_user_idx").on(t.userId, t.createdAt),
    index("gmail_deliveries_draft_idx").on(t.draftId, t.createdAt),
  ],
);

export const deliveryAttempts = pgTable(
  "delivery_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => gmailDeliveries.id, { onDelete: "cascade" }),
    attemptNo: integer("attempt_no").notNull().default(1),
    state: text("state").notNull().default("prepared").$type<
      "prepared" | "calling" | "confirmed" | "failed" | "unknown" | "superseded"
    >(),
    callStartedAt: timestamp("call_started_at", { withTimezone: true }),
    resultAt: timestamp("result_at", { withTimezone: true }),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    fencingToken: integer("fencing_token").notNull().default(1),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("delivery_attempts_no_key").on(t.deliveryId, t.attemptNo)],
);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    subject: text("subject").notNull().default(""),
    body: text("body").notNull().default(""),
    variables: jsonb("variables").notNull().default(sql`'[]'::jsonb`),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("templates_user_idx").on(t.userId, t.updatedAt)],
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    roleTitle: text("role_title").notNull(),
    jobUrl: text("job_url"),
    stage: text("stage").notNull().default("interested").$type<
      "interested" | "draft_ready" | "applied_or_contacted" | "conversation" | "interview" | "offer" | "closed"
    >(),
    contactId: uuid("contact_id"),
    draftId: uuid("draft_id"),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),
    nextActionNote: text("next_action_note"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("opportunities_user_stage_idx").on(t.userId, t.stage, t.updatedAt),
    index("opportunities_next_action_idx").on(t.nextActionAt),
    check("opportunities_job_url_safe", sql`${t.jobUrl} is null or ${t.jobUrl} ~ '^https?://'`),
  ],
);

export const opportunityNotes = pgTable(
  "opportunity_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("opportunity_notes_opportunity_idx").on(t.opportunityId, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    sourceEntity: text("source_entity"),
    // Unique source event avoids duplicate reminders (§17.5).
    sourceEvent: text("source_event"),
    title: text("title").notNull(),
    body: text("body"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("notifications_user_source_event_key").on(t.userId, t.sourceEvent),
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Financial entities (§17.6)                                          */
/* ------------------------------------------------------------------ */

export const creditAccounts = pgTable(
  "credit_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<"contact" | "ai">(),
    available: integer("available").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("credit_accounts_user_type_key").on(t.userId, t.type),
    check("credit_accounts_available_nonnegative", sql`${t.available} >= 0`),
    check("credit_accounts_reserved_nonnegative", sql`${t.reserved} >= 0`),
  ],
);

export const creditLots = pgTable(
  "credit_lots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<"contact" | "ai">(),
    sourceKind: text("source_kind").notNull().$type<"trial" | "purchase" | "adjustment" | "replacement">(),
    sourceRef: text("source_ref").notNull(),
    granted: integer("granted").notNull(),
    available: integer("available").notNull(),
    reserved: integer("reserved").notNull().default(0),
    consumed: integer("consumed").notNull().default(0),
    reversed: integer("reversed").notNull().default(0),
    policyVersion: text("policy_version"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credit_lots_user_type_idx").on(t.userId, t.type, t.createdAt),
    check(
      "credit_lots_conservation",
      sql`${t.granted} = ${t.available} + ${t.reserved} + ${t.consumed} + ${t.reversed}`,
    ),
    check("credit_lots_nonnegative", sql`${t.available} >= 0 and ${t.reserved} >= 0 and ${t.consumed} >= 0 and ${t.reversed} >= 0`),
  ],
);

export const creditReservations = pgTable(
  "credit_reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<"contact" | "ai">(),
    purpose: text("purpose").notNull().$type<"generation" | "refund_hold">(),
    operationRef: text("operation_ref").notNull(),
    quantity: integer("quantity").notNull(),
    state: text("state").notNull().default("reserved").$type<"reserved" | "consumed" | "released" | "reversed">(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("credit_reservations_operation_key").on(t.operationRef),
    check("credit_reservations_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export const creditLedgerEntries = pgTable(
  "credit_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => creditAccounts.id),
    userId: uuid("user_id").notNull(),
    type: text("type").notNull().$type<"contact" | "ai">(),
    kind: text("kind").notNull().$type<
      "grant" | "reserve" | "consume" | "release" | "reveal" | "reverse" | "adjustment" | "refund_hold" | "refund_reverse" | "refund_release"
    >(),
    availableDelta: integer("available_delta").notNull(),
    reservedDelta: integer("reserved_delta").notNull(),
    operationRef: text("operation_ref"),
    idempotencyRef: text("idempotency_ref"),
    actorType: text("actor_type").notNull().default("system").$type<"user" | "system" | "admin" | "worker">(),
    actorId: text("actor_id"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credit_ledger_user_idx").on(t.userId, t.type, t.createdAt),
    index("credit_ledger_idem_idx").on(t.idempotencyRef),
  ],
);

/** Consumption/reservation ↔ grant lots (enables refund treatment, §17.6). */
export const creditAllocations = pgTable(
  "credit_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: text("type").notNull().$type<"contact" | "ai">(),
    kind: text("kind").notNull().$type<"reserve" | "consume" | "release" | "reveal" | "reverse">(),
    lotId: uuid("lot_id")
      .notNull()
      .references(() => creditLots.id),
    reservationId: uuid("reservation_id"),
    unlockId: uuid("unlock_id"),
    operationRef: text("operation_ref"),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_allocations_lot_idx").on(t.lotId), index("credit_allocations_reservation_idx").on(t.reservationId)],
);

export const catalogVersions = pgTable("catalog_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: text("version").notNull(),
  state: text("state").notNull().default("published").$type<"draft" | "published" | "retired">(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogSkus = pgTable(
  "catalog_skus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catalogVersionId: uuid("catalog_version_id")
      .notNull()
      .references(() => catalogVersions.id),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    pricePaise: integer("price_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    contactCredits: integer("contact_credits").notNull().default(0),
    aiCredits: integer("ai_credits").notNull().default(0),
    state: text("state").notNull().default("published").$type<"published" | "retired">(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("catalog_skus_version_sku_key").on(t.catalogVersionId, t.sku),
    check("catalog_skus_price_nonnegative", sql`${t.pricePaise} >= 0`),
  ],
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    skuId: uuid("sku_id").notNull(),
    skuSnapshot: jsonb("sku_snapshot").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    provider: text("provider").notNull().default("razorpay"),
    providerOrderId: text("provider_order_id"),
    receipt: text("receipt").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("created").$type<
      "created" | "provider_created" | "pending" | "paid" | "fulfilled" | "cancelled" | "failed"
    >(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_orders_idempotency_key").on(t.userId, t.idempotencyKey),
    index("payment_orders_user_idx").on(t.userId, t.createdAt),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => paymentOrders.id),
    userId: uuid("user_id").notNull(),
    providerPaymentId: text("provider_payment_id").notNull(),
    providerOrderId: text("provider_order_id"),
    providerAmount: integer("provider_amount"),
    currency: text("currency").notNull().default("INR"),
    providerStatus: text("provider_status").notNull(),
    state: text("state").notNull().default("created").$type<
      "created" | "authorized" | "captured" | "fulfilled" | "failed" | "refunded" | "partially_refunded" | "disputed"
    >(),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payments_provider_payment_key").on(t.providerPaymentId)],
);

export const paymentGrants = pgTable(
  "payment_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    purpose: text("purpose").notNull().default("purchase"),
    contactCredits: integer("contact_credits").notNull().default(0),
    aiCredits: integer("ai_credits").notNull().default(0),
    ledgerRef: text("ledger_ref"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payment_grants_payment_purpose_key").on(t.paymentId, t.purpose)],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    providerRefundId: text("provider_refund_id").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    state: text("state").notNull().default("pending").$type<"pending" | "processed" | "failed">(),
    reversalLedgerRef: text("reversal_ledger_ref"),
    debtId: uuid("debt_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("refunds_provider_refund_key").on(t.providerRefundId)],
);

export const creditDebts = pgTable("credit_debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: text("type").notNull().$type<"contact" | "ai">(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  sourceRef: text("source_ref"),
  state: text("state").notNull().default("open").$type<"open" | "resolved" | "waived">(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    // Minimal/encrypted payload; raw bodies are not logged.
    payloadDigest: text("payload_digest"),
    storedPayload: jsonb("stored_payload"),
    processState: text("process_state").notNull().default("received").$type<
      "received" | "processing" | "processed" | "quarantined" | "failed"
    >(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("webhook_events_provider_event_key").on(t.provider, t.eventId),
    index("webhook_events_state_idx").on(t.processState, t.receivedAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Operational entities (§17.7)                                        */
/* ------------------------------------------------------------------ */

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull().$type<
      "resume.scan_parse" | "draft.generate" | "gmail.create_draft" | "gmail.reconcile" | "payment.fulfill" | "payment.reconcile" | "contacts.import_verify" | "privacy.export" | "privacy.delete" | "reminders.materialize" | "credits.reconcile" | "outbox.dispatch" | "digest.dispatch_daily"
    >(),
    userId: uuid("user_id"),
    entityId: uuid("entity_id"),
    inputVersion: integer("input_version").notNull().default(1),
    state: text("state").notNull().default("queued").$type<
      "queued" | "running" | "deferred" | "retry_wait" | "succeeded" | "failed" | "timed_out" | "needs_attention" | "cancelled"
    >(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    availableAfter: timestamp("available_after", { withTimezone: true }).notNull().defaultNow(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    fencingToken: integer("fencing_token").notNull().default(0),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    lastResult: jsonb("last_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("jobs_state_available_idx").on(t.state, t.availableAfter),
    index("jobs_kind_entity_state_idx").on(t.kind, t.entityId, t.state),
    index("jobs_lease_expiry_idx").on(t.leaseExpiresAt),
    index("jobs_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const jobSteps = pgTable(
  "job_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    stepKey: text("step_key").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    outcome: jsonb("outcome"),
  },
  (t) => [uniqueIndex("job_steps_job_key_key").on(t.jobId, t.stepKey)],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull().$type<"job.dispatch" | "job.retry" | "payment.fulfill" | "notification.create">(),
    payload: jsonb("payload").notNull(),
    publishState: text("publish_state").notNull().default("pending").$type<"pending" | "published" | "failed">(),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("outbox_events_pending_idx").on(t.publishState, t.nextAttemptAt)],
);

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").notNull(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    operationRef: text("operation_ref"),
    responseMeta: jsonb("response_meta"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("idempotency_records_scope_key").on(t.actorId, t.scope, t.key)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    permission: text("permission"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_events_time_idx").on(t.createdAt), index("audit_events_entity_idx").on(t.entityType, t.entityId)],
);

export const privacyRequests = pgTable("privacy_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().$type<"export" | "delete_account">(),
  state: text("state").notNull().default("requested").$type<"requested" | "processing" | "ready" | "completed" | "failed">(),
  resultRef: text("result_ref"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicRef: text("public_ref").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  state: text("state").notNull().default("open").$type<"open" | "in_review" | "resolved">(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotaWindows = pgTable(
  "quota_windows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    env: text("env").notNull(),
    operationKind: text("operation_kind").notNull(),
    principal: text("principal").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    admitted: integer("admitted").notNull().default(0),
    limitCount: integer("limit_count").notNull(),
    configVersion: text("config_version"),
  },
  (t) => [
    uniqueIndex("quota_windows_scope_key").on(t.env, t.operationKind, t.principal, t.windowStart),
  ],
);

export const operationAdmissions = pgTable(
  "operation_admissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operationRef: text("operation_ref").notNull(),
    quotaScope: text("quota_scope").notNull(),
    windowId: uuid("window_id").notNull(),
    state: text("state").notNull().default("admitted").$type<"admitted" | "rejected">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("operation_admissions_operation_key").on(t.operationRef)],
);

export const concurrencySlots = pgTable(
  "concurrency_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceScope: text("resource_scope").notNull(),
    ownerOperationRef: text("owner_operation_ref").notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }).notNull(),
    fencingToken: integer("fencing_token").notNull().default(1),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("concurrency_slots_scope_owner_key").on(t.resourceScope, t.ownerOperationRef),
    index("concurrency_slots_scope_idx").on(t.resourceScope, t.leaseExpiresAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Neon / PostgreSQL Object Storage                                    */
/* ------------------------------------------------------------------ */

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(val: Buffer | Uint8Array) {
    return Buffer.isBuffer(val) ? val : Buffer.from(val);
  },
  fromDriver(val: unknown) {
    return Buffer.isBuffer(val) ? val : Buffer.from(val as Uint8Array);
  },
});

export const storageObjects = pgTable(
  "storage_objects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    bytes: bytea("bytes").notNull(),
    byteSize: integer("byte_size").notNull(),
    contentType: text("content_type"),
    sha256: text("sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("storage_objects_bucket_key_idx").on(t.bucket, t.objectKey),
  ],
);

