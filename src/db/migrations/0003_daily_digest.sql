ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "daily_digest_enabled" boolean DEFAULT true NOT NULL;

CREATE TABLE IF NOT EXISTS "hiring_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid REFERENCES "companies"("id") ON DELETE SET NULL,
  "contact_id" uuid REFERENCES "contacts"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "company_name" text NOT NULL,
  "location" text,
  "role_category" text DEFAULT 'engineering' NOT NULL,
  "department" text DEFAULT 'engineering' NOT NULL,
  "source_platform" text DEFAULT 'reachbee' NOT NULL,
  "source_url" text,
  "post_snippet" text NOT NULL,
  "tech_stack" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "hiring_manager_name" text,
  "hiring_manager_title" text,
  "status" text DEFAULT 'active' NOT NULL,
  "posted_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hiring_posts_status_posted_idx" ON "hiring_posts" ("status", "posted_at");
CREATE INDEX IF NOT EXISTS "hiring_posts_role_idx" ON "hiring_posts" ("role_category", "status");

CREATE TABLE IF NOT EXISTS "digest_dispatches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "dispatch_date" text NOT NULL,
  "post_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "email_id" text,
  "status" text DEFAULT 'sent' NOT NULL,
  "dispatched_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "digest_dispatches_user_date_key" UNIQUE ("user_id", "dispatch_date")
);

CREATE INDEX IF NOT EXISTS "digest_dispatches_user_idx" ON "digest_dispatches" ("user_id", "dispatched_at");
