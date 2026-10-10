-- Hot-path indexes for queries that were sorting or scanning whole tables.
--   contacts_updated_idx        : directory ORDER BY updated_at DESC, id DESC + keyset cursor
--   contact_unlocks_contact_idx : per-contact unlock counts
--   gmail_deliveries_draft_idx  : latest delivery per draft
--   opportunities_next_action_idx : reminders.materialize sweep (runs every minute)
--   jobs_kind_entity_state_idx  : generation job lookups by (kind, entity_id, state)
CREATE INDEX IF NOT EXISTS "contacts_updated_idx" ON "contacts" ("updated_at", "id");
CREATE INDEX IF NOT EXISTS "contact_unlocks_contact_idx" ON "contact_unlocks" ("contact_id");
CREATE INDEX IF NOT EXISTS "gmail_deliveries_draft_idx" ON "gmail_deliveries" ("draft_id", "created_at");
CREATE INDEX IF NOT EXISTS "opportunities_next_action_idx" ON "opportunities" ("next_action_at");
CREATE INDEX IF NOT EXISTS "jobs_kind_entity_state_idx" ON "jobs" ("kind", "entity_id", "state");
