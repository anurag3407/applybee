ALTER TABLE "drafts" DROP CONSTRAINT IF EXISTS "drafts_recipient_rule";
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_recipient_rule" CHECK ("contact_id" IS NULL OR "own_recipient_email" IS NULL);
