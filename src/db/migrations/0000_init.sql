CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"permission" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"reason" text,
	"metadata" jsonb,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_revision_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"fact_type" text NOT NULL,
	"text" text NOT NULL,
	"source_ref" text,
	"approved" boolean DEFAULT false NOT NULL,
	"numeric_value" integer,
	"unit" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_profile_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"revision_no" integer NOT NULL,
	"source" text NOT NULL,
	"resume_id" uuid,
	"extracted" jsonb,
	"content_hash" text NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_revision_id" uuid,
	"active_resume_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_version_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"contact_credits" integer DEFAULT 0 NOT NULL,
	"ai_credits" integer DEFAULT 0 NOT NULL,
	"state" text DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "catalog_skus_price_nonnegative" CHECK ("catalog_skus"."price_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "catalog_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"state" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"location" text,
	"stage" text,
	"category" text,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"fact_type" text NOT NULL,
	"value" text NOT NULL,
	"source_url" text,
	"source_name" text,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"rights_basis" text DEFAULT 'licensed' NOT NULL,
	"approval" text DEFAULT 'approved' NOT NULL,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concurrency_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_scope" text NOT NULL,
	"owner_operation_ref" text NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"fencing_token" integer DEFAULT 1 NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid,
	"contact_id" uuid,
	"email_fingerprint" text,
	"report_type" text NOT NULL,
	"details" text,
	"proof_contact" text,
	"state" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contact_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"source_uri" text,
	"license_ref" text,
	"collection_date" timestamp with time zone,
	"permitted_uses" text,
	"retention" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_fingerprint" text NOT NULL,
	"contact_id" uuid,
	"scope" text DEFAULT 'delivery_wide' NOT NULL,
	"reason" text NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contact_unlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"consumption_ref" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"contact_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"method" text NOT NULL,
	"provider" text,
	"result" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evidence_meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"role_category" text NOT NULL,
	"location" text,
	"profile_url" text,
	"email_enc" text,
	"email_fingerprint" text NOT NULL,
	"email_domain" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"verification_status" text DEFAULT 'unknown' NOT NULL,
	"last_email_checked_at" timestamp with time zone,
	"employment_checked_at" timestamp with time zone,
	"is_hiring_manager" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"available" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_accounts_available_nonnegative" CHECK ("credit_accounts"."available" >= 0),
	CONSTRAINT "credit_accounts_reserved_nonnegative" CHECK ("credit_accounts"."reserved" >= 0)
);
--> statement-breakpoint
CREATE TABLE "credit_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"kind" text NOT NULL,
	"lot_id" uuid NOT NULL,
	"reservation_id" uuid,
	"unlock_id" uuid,
	"operation_ref" text,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"source_ref" text,
	"state" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "credit_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"kind" text NOT NULL,
	"available_delta" integer NOT NULL,
	"reserved_delta" integer NOT NULL,
	"operation_ref" text,
	"idempotency_ref" text,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"actor_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"source_kind" text NOT NULL,
	"source_ref" text NOT NULL,
	"granted" integer NOT NULL,
	"available" integer NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"consumed" integer DEFAULT 0 NOT NULL,
	"reversed" integer DEFAULT 0 NOT NULL,
	"policy_version" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_lots_conservation" CHECK ("credit_lots"."granted" = "credit_lots"."available" + "credit_lots"."reserved" + "credit_lots"."consumed" + "credit_lots"."reversed"),
	CONSTRAINT "credit_lots_nonnegative" CHECK ("credit_lots"."available" >= 0 and "credit_lots"."reserved" >= 0 and "credit_lots"."consumed" >= 0 and "credit_lots"."reversed" >= 0)
);
--> statement-breakpoint
CREATE TABLE "credit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"purpose" text NOT NULL,
	"operation_ref" text NOT NULL,
	"quantity" integer NOT NULL,
	"state" text DEFAULT 'reserved' NOT NULL,
	"deadline_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_reservations_quantity_positive" CHECK ("credit_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"state" text DEFAULT 'prepared' NOT NULL,
	"call_started_at" timestamp with time zone,
	"result_at" timestamp with time zone,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"fencing_token" integer DEFAULT 1 NOT NULL,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"connection_version" integer NOT NULL,
	"recipient_fingerprint" text NOT NULL,
	"attachment_resume_id" uuid,
	"attachment_sha256" text,
	"approval_hash" text NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invalidated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "draft_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"excerpt" text NOT NULL,
	"fact_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validation_result" text DEFAULT 'supported' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"revision_no" integer NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"recipient_snapshot" jsonb,
	"resume_id" uuid,
	"profile_revision_id" uuid,
	"generation_id" uuid,
	"content_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" text DEFAULT 'manual' NOT NULL,
	"intent" text DEFAULT 'intro' NOT NULL,
	"contact_id" uuid,
	"own_recipient_email" text,
	"own_recipient_name" text,
	"opportunity_id" uuid,
	"current_revision_id" uuid,
	"current_version" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"list_subject" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drafts_recipient_rule" CHECK (("drafts"."contact_id" is not null) <> ("drafts"."own_recipient_email" is not null))
);
--> statement-breakpoint
CREATE TABLE "generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"intent" text NOT NULL,
	"base_revision_id" uuid,
	"base_version" integer NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"input_hash" text NOT NULL,
	"reservation_id" uuid,
	"prompt_version" text,
	"model_id" text,
	"state" text DEFAULT 'reserved' NOT NULL,
	"proposed_revision_id" uuid,
	"acceptance_state" text DEFAULT 'pending' NOT NULL,
	"usage" jsonb,
	"failure_code" text,
	"failure_message" text,
	"deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "gmail_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"google_subject" text NOT NULL,
	"google_email" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"token_envelope_enc" text,
	"token_key_version" integer,
	"access_token_expires_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"refresh_lease_owner" text,
	"refresh_lease_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"connection_version" integer NOT NULL,
	"approval_hash" text NOT NULL,
	"operation_marker" text NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"provider_draft_id" text,
	"provider_message_id" text,
	"unknown_since" timestamp with time zone,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"operation_ref" text,
	"response_meta" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"normalized_key" text,
	"outcome" text NOT NULL,
	"error_code" text,
	"message" text,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" uuid NOT NULL,
	"source_name" text NOT NULL,
	"license_ref" text NOT NULL,
	"file_ref" text,
	"mode" text DEFAULT 'dry_run' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"inserted_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "job_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"outcome" jsonb
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"user_id" uuid,
	"entity_id" uuid,
	"input_version" integer DEFAULT 1 NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"available_after" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"fencing_token" integer DEFAULT 0 NOT NULL,
	"deadline_at" timestamp with time zone,
	"error_code" text,
	"error_message" text,
	"last_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"source_entity" text,
	"source_event" text,
	"title" text NOT NULL,
	"body" text,
	"scheduled_for" timestamp with time zone,
	"read_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"nonce_hash" text NOT NULL,
	"verifier_encrypted" text,
	"return_path" text DEFAULT '/app/settings/integrations' NOT NULL,
	"intent" text DEFAULT 'connect' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operation_admissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_ref" text NOT NULL,
	"quota_scope" text NOT NULL,
	"window_id" uuid NOT NULL,
	"state" text DEFAULT 'admitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"role_title" text NOT NULL,
	"job_url" text,
	"stage" text DEFAULT 'interested' NOT NULL,
	"contact_id" uuid,
	"draft_id" uuid,
	"next_action_at" timestamp with time zone,
	"next_action_note" text,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_job_url_safe" CHECK ("opportunities"."job_url" is null or "opportunities"."job_url" ~ '^https?://')
);
--> statement-breakpoint
CREATE TABLE "opportunity_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"publish_state" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"purpose" text DEFAULT 'purchase' NOT NULL,
	"contact_credits" integer DEFAULT 0 NOT NULL,
	"ai_credits" integer DEFAULT 0 NOT NULL,
	"ledger_ref" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sku_id" uuid NOT NULL,
	"sku_snapshot" jsonb NOT NULL,
	"amount_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"provider_order_id" text,
	"receipt" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_payment_id" text NOT NULL,
	"provider_order_id" text,
	"provider_amount" integer,
	"currency" text DEFAULT 'INR' NOT NULL,
	"provider_status" text NOT NULL,
	"state" text DEFAULT 'created' NOT NULL,
	"captured_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"state" text DEFAULT 'requested' NOT NULL,
	"result_ref" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quota_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env" text NOT NULL,
	"operation_kind" text NOT NULL,
	"principal" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"admitted" integer DEFAULT 0 NOT NULL,
	"limit_count" integer NOT NULL,
	"config_version" text
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider_refund_id" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"reversal_ledger_ref" text,
	"debt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"object_version" text,
	"display_filename" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"sha256" text NOT NULL,
	"mime_type" text DEFAULT 'application/pdf' NOT NULL,
	"page_count" integer,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"scan_version" text,
	"scanned_at" timestamp with time zone,
	"scan_note" text,
	"parser_version" text,
	"parse_state" text DEFAULT 'pending' NOT NULL,
	"state" text DEFAULT 'uploaded' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resumes_byte_size_positive" CHECK ("resumes"."byte_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "saved_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_ref" text NOT NULL,
	"email" text NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text DEFAULT 'free_trial_v1' NOT NULL,
	"identity_fingerprint" text NOT NULL,
	"decision" text DEFAULT 'eligible' NOT NULL,
	"policy_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"program_id" text DEFAULT 'free_trial_v1' NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"policy_version" text NOT NULL,
	"grant_ref" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text DEFAULT 'resume' NOT NULL,
	"object_key" text NOT NULL,
	"max_bytes" bigint NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"expected_meta" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"career_stage" text,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"default_mode" text DEFAULT 'manual' NOT NULL,
	"default_tone" text DEFAULT 'warm_professional' NOT NULL,
	"notify_reminders" boolean DEFAULT true NOT NULL,
	"notify_product" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"onboarding_step" text DEFAULT 'profile' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"deletion_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_status_check" CHECK ("users"."status" in ('active','disabled','deleting','deleted'))
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload_digest" text,
	"stored_payload" jsonb,
	"process_state" text DEFAULT 'received' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_facts" ADD CONSTRAINT "candidate_facts_profile_revision_id_candidate_profile_revisions_id_fk" FOREIGN KEY ("profile_revision_id") REFERENCES "public"."candidate_profile_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profile_revisions" ADD CONSTRAINT "candidate_profile_revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profile_revisions" ADD CONSTRAINT "candidate_profile_revisions_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_skus" ADD CONSTRAINT "catalog_skus_catalog_version_id_catalog_versions_id_fk" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."catalog_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_evidence" ADD CONSTRAINT "company_evidence_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_sources" ADD CONSTRAINT "contact_sources_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_unlocks" ADD CONSTRAINT "contact_unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_unlocks" ADD CONSTRAINT "contact_unlocks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_verifications" ADD CONSTRAINT "contact_verifications_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_lot_id_credit_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."credit_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_debts" ADD CONSTRAINT "credit_debts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_account_id_credit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_lots" ADD CONSTRAINT "credit_lots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_delivery_id_gmail_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."gmail_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_approvals" ADD CONSTRAINT "draft_approvals_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_approvals" ADD CONSTRAINT "draft_approvals_revision_id_draft_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."draft_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_approvals" ADD CONSTRAINT "draft_approvals_connection_id_gmail_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."gmail_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_claims" ADD CONSTRAINT "draft_claims_revision_id_draft_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."draft_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_revisions" ADD CONSTRAINT "draft_revisions_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_connections" ADD CONSTRAINT "gmail_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_deliveries" ADD CONSTRAINT "gmail_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_deliveries" ADD CONSTRAINT "gmail_deliveries_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_run_id_import_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."import_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_steps" ADD CONSTRAINT "job_steps_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_grants" ADD CONSTRAINT "payment_grants_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_payment_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_contacts" ADD CONSTRAINT "saved_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_contacts" ADD CONSTRAINT "saved_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_grants" ADD CONSTRAINT "trial_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_grants" ADD CONSTRAINT "trial_grants_entitlement_id_trial_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."trial_entitlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_intents" ADD CONSTRAINT "upload_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_time_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "candidate_facts_revision_idx" ON "candidate_facts" USING btree ("profile_revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_profile_revisions_no_key" ON "candidate_profile_revisions" USING btree ("profile_id","revision_no");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_profiles_user_key" ON "candidate_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_skus_version_sku_key" ON "catalog_skus" USING btree ("catalog_version_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_domain_key" ON "companies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "company_evidence_company_idx" ON "company_evidence" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "concurrency_slots_scope_owner_key" ON "concurrency_slots" USING btree ("resource_scope","owner_operation_ref");--> statement-breakpoint
CREATE INDEX "concurrency_slots_scope_idx" ON "concurrency_slots" USING btree ("resource_scope","lease_expires_at");--> statement-breakpoint
CREATE INDEX "contact_reports_state_idx" ON "contact_reports" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "contact_sources_contact_idx" ON "contact_sources" USING btree ("contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_suppressions_fingerprint_active_key" ON "contact_suppressions" USING btree ("email_fingerprint") WHERE state = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "contact_unlocks_user_contact_key" ON "contact_unlocks" USING btree ("user_id","contact_id");--> statement-breakpoint
CREATE INDEX "contact_unlocks_user_idx" ON "contact_unlocks" USING btree ("user_id","unlocked_at");--> statement-breakpoint
CREATE INDEX "contact_verifications_contact_idx" ON "contact_verifications" USING btree ("contact_id","checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_email_fingerprint_key" ON "contacts" USING btree ("email_fingerprint");--> statement-breakpoint
CREATE INDEX "contacts_directory_idx" ON "contacts" USING btree ("status","role_category","location","company_id","id");--> statement-breakpoint
CREATE INDEX "contacts_name_trgm_idx" ON "contacts" USING gin (name gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "credit_accounts_user_type_key" ON "credit_accounts" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "credit_allocations_lot_idx" ON "credit_allocations" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "credit_allocations_reservation_idx" ON "credit_allocations" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_user_idx" ON "credit_ledger_entries" USING btree ("user_id","type","created_at");--> statement-breakpoint
CREATE INDEX "credit_ledger_idem_idx" ON "credit_ledger_entries" USING btree ("idempotency_ref");--> statement-breakpoint
CREATE INDEX "credit_lots_user_type_idx" ON "credit_lots" USING btree ("user_id","type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_reservations_operation_key" ON "credit_reservations" USING btree ("operation_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_attempts_no_key" ON "delivery_attempts" USING btree ("delivery_id","attempt_no");--> statement-breakpoint
CREATE INDEX "draft_approvals_draft_idx" ON "draft_approvals" USING btree ("draft_id","approved_at");--> statement-breakpoint
CREATE INDEX "draft_claims_revision_idx" ON "draft_claims" USING btree ("revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_revisions_draft_no_key" ON "draft_revisions" USING btree ("draft_id","revision_no");--> statement-breakpoint
CREATE INDEX "drafts_user_updated_idx" ON "drafts" USING btree ("user_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "generation_requests_draft_idx" ON "generation_requests" USING btree ("draft_id","created_at");--> statement-breakpoint
CREATE INDEX "generation_requests_state_idx" ON "generation_requests" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "gmail_connections_user_active_key" ON "gmail_connections" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "gmail_connections_user_idx" ON "gmail_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gmail_deliveries_user_idx" ON "gmail_deliveries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_records_scope_key" ON "idempotency_records" USING btree ("actor_id","scope","key");--> statement-breakpoint
CREATE INDEX "import_rows_run_idx" ON "import_rows" USING btree ("run_id","row_index");--> statement-breakpoint
CREATE UNIQUE INDEX "job_steps_job_key_key" ON "job_steps" USING btree ("job_id","step_key");--> statement-breakpoint
CREATE INDEX "jobs_state_available_idx" ON "jobs" USING btree ("state","available_after");--> statement-breakpoint
CREATE INDEX "jobs_lease_expiry_idx" ON "jobs" USING btree ("lease_expires_at");--> statement-breakpoint
CREATE INDEX "jobs_user_created_idx" ON "jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_source_event_key" ON "notifications" USING btree ("user_id","source_event");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_states_state_hash_key" ON "oauth_states" USING btree ("state_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "operation_admissions_operation_key" ON "operation_admissions" USING btree ("operation_ref");--> statement-breakpoint
CREATE INDEX "opportunities_user_stage_idx" ON "opportunities" USING btree ("user_id","stage","updated_at");--> statement-breakpoint
CREATE INDEX "opportunity_notes_opportunity_idx" ON "opportunity_notes" USING btree ("opportunity_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_events_pending_idx" ON "outbox_events" USING btree ("publish_state","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_grants_payment_purpose_key" ON "payment_grants" USING btree ("payment_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_idempotency_key" ON "payment_orders" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_orders_user_idx" ON "payment_orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_payment_key" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quota_windows_scope_key" ON "quota_windows" USING btree ("env","operation_kind","principal","window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_provider_refund_key" ON "refunds" USING btree ("provider_refund_id");--> statement-breakpoint
CREATE INDEX "resumes_user_idx" ON "resumes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_contacts_user_contact_key" ON "saved_contacts" USING btree ("user_id","contact_id");--> statement-breakpoint
CREATE INDEX "templates_user_idx" ON "templates" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trial_entitlements_program_identity_key" ON "trial_entitlements" USING btree ("program_id","identity_fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "trial_grants_user_program_key" ON "trial_grants" USING btree ("user_id","program_id");--> statement-breakpoint
CREATE INDEX "upload_intents_user_idx" ON "upload_intents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_assignments_user_role_key" ON "user_role_assignments" USING btree ("user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_key" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_state_idx" ON "webhook_events" USING btree ("process_state","received_at");