ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "department" text DEFAULT 'engineering' NOT NULL;
CREATE INDEX IF NOT EXISTS "contacts_dept_idx" ON "contacts" ("status", "department", "location", "id");
