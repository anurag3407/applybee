-- Apply Bee — audited SQL functions (plan §18).
-- Financial multi-step state transitions execute atomically in one transaction.
-- SECURITY INVOKER; the runtime role cannot alter these functions.

---------------------------------------------------------------------
-- provision_user_and_trial
-- Idempotent provisioning: user row + credit accounts + once-only trial
-- grant keyed by a stable program id and verified-identity fingerprint.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION provision_user_and_trial(
  p_clerk_id text,
  p_email text,
  p_display_name text,
  p_identity_fingerprint text,
  p_trial_contact_credits integer,
  p_trial_ai_credits integer,
  p_policy_version text
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_program_id text := 'free_trial_v1';
  v_entitlement_id uuid;
  v_existing_entitlement uuid;
  v_lot_id uuid;
  v_status text;
BEGIN
  -- Terminal tombstone check: a deleting/deleted account cannot be resurrected
  -- by a delayed identity webhook (§17.2).
  SELECT id, status INTO v_user_id, v_status FROM users WHERE clerk_id = p_clerk_id;
  IF v_user_id IS NOT NULL THEN
    IF v_status IN ('deleting','deleted') THEN
      RAISE EXCEPTION 'ACCOUNT_DELETED';
    END IF;
    RETURN v_user_id;
  END IF;

  INSERT INTO users (clerk_id, email, display_name)
  VALUES (p_clerk_id, p_email, p_display_name)
  RETURNING id INTO v_user_id;

  INSERT INTO user_preferences (user_id) VALUES (v_user_id);

  -- Trial entitlement is keyed to the verified identity fingerprint, not the
  -- auth subject: delete-and-reregister cannot regrant (§17.2).
  SELECT id INTO v_existing_entitlement
  FROM trial_entitlements
  WHERE program_id = v_program_id AND identity_fingerprint = p_identity_fingerprint;

  IF v_existing_entitlement IS NOT NULL THEN
    INSERT INTO credit_accounts (user_id, type, available, reserved) VALUES
      (v_user_id, 'contact', 0, 0),
      (v_user_id, 'ai', 0, 0);
    RETURN v_user_id;
  END IF;

  INSERT INTO trial_entitlements (program_id, identity_fingerprint, decision, policy_version)
  VALUES (v_program_id, p_identity_fingerprint, 'eligible', p_policy_version)
  RETURNING id INTO v_entitlement_id;

  INSERT INTO trial_grants (user_id, program_id, entitlement_id, policy_version, grant_ref)
  VALUES (v_user_id, v_program_id, v_entitlement_id, p_policy_version,
          'grant_' || v_user_id::text || '_' || v_program_id);

  INSERT INTO credit_accounts (user_id, type, available, reserved) VALUES
    (v_user_id, 'contact', p_trial_contact_credits, 0),
    (v_user_id, 'ai', p_trial_ai_credits, 0);

  INSERT INTO credit_lots (user_id, type, source_kind, source_ref, granted, available, policy_version)
  VALUES (v_user_id, 'contact', 'trial', v_program_id, p_trial_contact_credits, p_trial_contact_credits, p_policy_version);
  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, reason)
  SELECT id, v_user_id, 'contact', 'grant', p_trial_contact_credits, 0, 'trial:' || v_program_id, 'trial:' || v_program_id || ':contact:' || v_user_id::text, 'system', 'Free trial grant'
  FROM credit_accounts WHERE user_id = v_user_id AND type = 'contact';

  INSERT INTO credit_lots (user_id, type, source_kind, source_ref, granted, available, policy_version)
  VALUES (v_user_id, 'ai', 'trial', v_program_id, p_trial_ai_credits, p_trial_ai_credits, p_policy_version);
  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, reason)
  SELECT id, v_user_id, 'ai', 'grant', p_trial_ai_credits, 0, 'trial:' || v_program_id, 'trial:' || v_program_id || ':ai:' || v_user_id::text, 'system', 'Free trial grant'
  FROM credit_accounts WHERE user_id = v_user_id AND type = 'ai';

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- allocate_lots (internal helper)
-- Deterministic lot allocation: trial/promotional first, then paid by
-- earliest expiry, grant timestamp, then id (§18.2). Caller holds the
-- account lock; lots are locked in stable order.
-- kind='reserve': available → reserved. kind='reveal': available → consumed.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION allocate_lots(
  p_user_id uuid,
  p_type text,
  p_quantity integer,
  p_kind text,
  p_reservation_id uuid,
  p_operation_ref text
) RETURNS void AS $$
DECLARE
  v_remaining integer := p_quantity;
  v_lot record;
  v_take integer;
BEGIN
  IF p_quantity <= 0 THEN RETURN; END IF;
  FOR v_lot IN
    SELECT id, available FROM credit_lots
    WHERE user_id = p_user_id AND type = p_type AND available > 0
    ORDER BY
      (source_kind = 'trial') DESC,
      (expires_at IS NOT NULL) DESC,
      expires_at ASC NULLS LAST,
      created_at ASC,
      id ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_remaining, v_lot.available);
    IF p_kind = 'reserve' THEN
      UPDATE credit_lots SET available = available - v_take, reserved = reserved + v_take WHERE id = v_lot.id;
    ELSIF p_kind = 'reveal' THEN
      UPDATE credit_lots SET available = available - v_take, consumed = consumed + v_take WHERE id = v_lot.id;
    ELSE
      RAISE EXCEPTION 'UNKNOWN_ALLOCATION_KIND';
    END IF;
    INSERT INTO credit_allocations (user_id, type, kind, lot_id, reservation_id, operation_ref, quantity)
    VALUES (p_user_id, p_type, p_kind, v_lot.id, p_reservation_id, p_operation_ref, v_take);
    v_remaining := v_remaining - v_take;
  END LOOP;
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'LOT_ALLOCATION_SHORTFALL';
  END IF;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- consume_reservation_lots (internal helper)
-- Move a reservation's allocated quantities from reserved → consumed.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION consume_reservation_lots(
  p_reservation_id uuid,
  p_operation_ref text
) RETURNS void AS $$
DECLARE
  v_alloc record;
BEGIN
  FOR v_alloc IN
    SELECT ca.id, ca.lot_id, ca.quantity FROM credit_allocations ca
    WHERE ca.reservation_id = p_reservation_id AND ca.kind = 'reserve' AND ca.quantity > 0
    FOR UPDATE
  LOOP
    UPDATE credit_lots SET reserved = reserved - v_alloc.quantity, consumed = consumed + v_alloc.quantity
    WHERE id = v_alloc.lot_id;
    INSERT INTO credit_allocations (user_id, type, kind, lot_id, reservation_id, operation_ref, quantity)
    SELECT user_id, type, 'consume', v_alloc.lot_id, p_reservation_id, p_operation_ref, v_alloc.quantity
    FROM credit_allocations WHERE id = v_alloc.id;
    DELETE FROM credit_allocations WHERE id = v_alloc.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- reveal_contact (§18.3)
-- Atomic first-reveal: one debit, one unlock, ledger entry; concurrent
-- calls converge on the existing unlock without a second charge.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reveal_contact(
  p_user_id uuid,
  p_contact_id uuid,
  p_operation_ref text,
  p_actor text DEFAULT 'user'
) RETURNS jsonb AS $$
DECLARE
  v_contact record;
  v_unlock_id uuid;
  v_account record;
  v_existing_unlock uuid;
  v_ledger_id uuid;
BEGIN
  -- Lock contact availability/version first (consistent lock order).
  SELECT c.id, c.status, c.verification_status
    INTO v_contact
  FROM contacts c WHERE c.id = p_contact_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONTACT_NOT_FOUND';
  END IF;
  IF v_contact.status IN ('suppressed', 'removed') THEN
    RAISE EXCEPTION 'CONTACT_UNAVAILABLE';
  END IF;
  IF v_contact.verification_status = 'invalid' THEN
    RAISE EXCEPTION 'CONTACT_INVALID';
  END IF;

  SELECT id INTO v_existing_unlock FROM contact_unlocks
  WHERE user_id = p_user_id AND contact_id = p_contact_id;
  IF v_existing_unlock IS NOT NULL THEN
    RETURN jsonb_build_object('unlock_id', v_existing_unlock, 'already_unlocked', true, 'charged', false);
  END IF;

  -- Lock the user's contact account, then recheck unlock under lock.
  SELECT * INTO v_account FROM credit_accounts
  WHERE user_id = p_user_id AND type = 'contact' FOR UPDATE;

  SELECT id INTO v_existing_unlock FROM contact_unlocks
  WHERE user_id = p_user_id AND contact_id = p_contact_id;
  IF v_existing_unlock IS NOT NULL THEN
    RETURN jsonb_build_object('unlock_id', v_existing_unlock, 'already_unlocked', true, 'charged', false);
  END IF;

  IF v_account.available < 1 THEN
    RAISE EXCEPTION 'INSUFFICIENT_CONTACT_CREDITS';
  END IF;

  UPDATE credit_accounts
  SET available = available - 1, version = version + 1, updated_at = now()
  WHERE id = v_account.id
  RETURNING * INTO v_account;

  INSERT INTO contact_unlocks (user_id, contact_id, consumption_ref)
  VALUES (p_user_id, p_contact_id, gen_random_uuid())
  RETURNING id INTO v_unlock_id;

  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, actor_id, reason)
  VALUES (v_account.id, p_user_id, 'contact', 'reveal', -1, 0, p_operation_ref, 'reveal:' || p_operation_ref, p_actor, p_user_id::text, 'Contact email revealed')
  RETURNING id INTO v_ledger_id;

  UPDATE contact_unlocks SET consumption_ref = v_ledger_id WHERE id = v_unlock_id;

  -- Direct reveal consumption allocated/consumed in the reveal transaction (§18.2).
  PERFORM allocate_lots(p_user_id, 'contact', 1, 'reveal', NULL, p_operation_ref);

  RETURN jsonb_build_object('unlock_id', v_unlock_id, 'already_unlocked', false, 'charged', true);
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- reserve_generation (§18.4)
-- Idempotent reservation with deterministic lot allocation. Job/outbox
-- rows are inserted by the service in the same transaction.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_generation(
  p_user_id uuid,
  p_operation_ref text,
  p_quantity integer DEFAULT 1
) RETURNS jsonb AS $$
DECLARE
  v_account record;
  v_reservation_id uuid;
  v_existing record;
BEGIN
  SELECT * INTO v_existing FROM credit_reservations WHERE operation_ref = p_operation_ref;
  IF FOUND THEN
    RETURN jsonb_build_object('reservation_id', v_existing.id, 'state', v_existing.state, 'existing', true);
  END IF;

  SELECT * INTO v_account FROM credit_accounts
  WHERE user_id = p_user_id AND type = 'ai' FOR UPDATE;

  IF v_account.available < p_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_AI_CREDITS';
  END IF;

  UPDATE credit_accounts
  SET available = available - p_quantity, reserved = reserved + p_quantity, version = version + 1, updated_at = now()
  WHERE id = v_account.id;

  INSERT INTO credit_reservations (user_id, type, purpose, operation_ref, quantity, deadline_at)
  VALUES (p_user_id, 'ai', 'generation', p_operation_ref, p_quantity, now() + interval '10 minutes')
  RETURNING id INTO v_reservation_id;

  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, actor_id, reason)
  VALUES (v_account.id, p_user_id, 'ai', 'reserve', -p_quantity, p_quantity, p_operation_ref, 'reserve:' || p_operation_ref, 'user', p_user_id::text, 'AI generation reserved');

  -- Allocate the required quantities at reservation time, not after work (§18.2).
  PERFORM allocate_lots(p_user_id, 'ai', p_quantity, 'reserve', v_reservation_id, p_operation_ref);

  RETURN jsonb_build_object('reservation_id', v_reservation_id, 'state', 'reserved', 'existing', false);
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- complete_generation — validated artifact + consumption, atomically.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION complete_generation(p_operation_ref text) RETURNS void AS $$
DECLARE
  v_res record;
BEGIN
  SELECT * INTO v_res FROM credit_reservations WHERE operation_ref = p_operation_ref FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND'; END IF;
  IF v_res.state = 'consumed' THEN RETURN; END IF; -- idempotent
  IF v_res.state <> 'reserved' THEN
    RAISE EXCEPTION 'RESERVATION_STATE_INVALID (%)', v_res.state;
  END IF;

  UPDATE credit_reservations SET state = 'consumed', settled_at = now() WHERE id = v_res.id;

  UPDATE credit_accounts
  SET reserved = reserved - v_res.quantity, version = version + 1, updated_at = now()
  WHERE user_id = v_res.user_id AND type = 'ai';

  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, actor_id, reason)
  SELECT id, v_res.user_id, 'ai', 'consume', 0, -v_res.quantity, p_operation_ref, 'consume:' || p_operation_ref, 'worker', v_res.user_id::text, 'AI generation completed'
  FROM credit_accounts WHERE user_id = v_res.user_id AND type = 'ai';

  PERFORM consume_reservation_lots(v_res.id, p_operation_ref);
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- release_generation — known failure/cancellation; release exactly once.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_generation(p_operation_ref text) RETURNS void AS $$
DECLARE
  v_res record;
BEGIN
  SELECT * INTO v_res FROM credit_reservations WHERE operation_ref = p_operation_ref FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_res.state = 'released' THEN RETURN; END IF; -- idempotent
  IF v_res.state <> 'reserved' THEN
    -- Consumed/reversed: a release can never revive a charge.
    RAISE EXCEPTION 'RESERVATION_STATE_INVALID (%)', v_res.state;
  END IF;

  UPDATE credit_reservations SET state = 'released', settled_at = now() WHERE id = v_res.id;

  UPDATE credit_accounts
  SET available = available + v_res.quantity, reserved = reserved - v_res.quantity, version = version + 1, updated_at = now()
  WHERE user_id = v_res.user_id AND type = 'ai';

  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, actor_id, reason)
  SELECT id, v_res.user_id, 'ai', 'release', v_res.quantity, -v_res.quantity, p_operation_ref, 'release:' || p_operation_ref, 'worker', v_res.user_id::text, 'AI generation failed or cancelled'
  FROM credit_accounts WHERE user_id = v_res.user_id AND type = 'ai';

  UPDATE credit_lots cl SET reserved = cl.reserved - ca.quantity, available = cl.available + ca.quantity
  FROM credit_allocations ca
  WHERE ca.lot_id = cl.id AND ca.reservation_id = v_res.id AND ca.kind = 'reserve' AND ca.quantity > 0;
  DELETE FROM credit_allocations WHERE reservation_id = v_res.id AND kind = 'reserve';
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- grant_credits — append lot + ledger + account movement.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION grant_credits(
  p_user_id uuid,
  p_type text,
  p_quantity integer,
  p_source_kind text,
  p_source_ref text
) RETURNS void AS $$
DECLARE
  v_account_id uuid;
BEGIN
  IF p_quantity <= 0 THEN RETURN; END IF;
  UPDATE credit_accounts
  SET available = available + p_quantity, version = version + 1, updated_at = now()
  WHERE user_id = p_user_id AND type = p_type
  RETURNING id INTO v_account_id;

  INSERT INTO credit_lots (user_id, type, source_kind, source_ref, granted, available)
  VALUES (p_user_id, p_type, p_source_kind, p_source_ref, p_quantity, p_quantity);

  INSERT INTO credit_ledger_entries
    (account_id, user_id, type, kind, available_delta, reserved_delta, operation_ref, idempotency_ref, actor_type, reason)
  VALUES (v_account_id, p_user_id, p_type, 'grant', p_quantity, 0, p_source_kind || ':' || p_source_ref, 'grant:' || p_source_kind || ':' || p_source_ref || ':' || p_type, 'system', 'Credits granted');
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- fulfill_captured_payment (§21.3)
-- Grant exactly once per captured payment, regardless of how many
-- webhook events reference it.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fulfill_captured_payment(
  p_provider_payment_id text,
  p_provider_order_id text,
  p_amount integer,
  p_currency text
) RETURNS jsonb AS $$
DECLARE
  v_order record;
  v_payment_id uuid;
  v_existing_grant uuid;
  v_grant_id uuid;
  v_sku jsonb;
BEGIN
  SELECT * INTO v_order FROM payment_orders WHERE provider_order_id = p_provider_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Validate expected payment/order snapshot (§21.3 step 8).
  IF p_amount <> v_order.amount_paise OR p_currency <> v_order.currency THEN
    RAISE EXCEPTION 'PAYMENT_MISMATCH';
  END IF;

  INSERT INTO payments (order_id, user_id, provider_payment_id, provider_order_id, provider_amount, currency, provider_status, state, captured_at)
  VALUES (v_order.id, v_order.user_id, p_provider_payment_id, p_provider_order_id, p_amount, p_currency, 'captured', 'captured', now())
  ON CONFLICT (provider_payment_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_payment_id;

  SELECT id INTO v_existing_grant FROM payment_grants WHERE payment_id = v_payment_id AND purpose = 'purchase';
  IF v_existing_grant IS NOT NULL THEN
    RETURN jsonb_build_object('granted', false, 'already_granted', true, 'payment_id', v_payment_id);
  END IF;

  v_sku := v_order.sku_snapshot;

  UPDATE payments SET state = 'fulfilled', fulfilled_at = now() WHERE id = v_payment_id;
  UPDATE payment_orders SET status = 'fulfilled', updated_at = now() WHERE id = v_order.id;

  INSERT INTO payment_grants (payment_id, purpose, contact_credits, ai_credits)
  VALUES (v_payment_id, 'purchase', COALESCE((v_sku->>'contact_credits')::integer, 0), COALESCE((v_sku->>'ai_credits')::integer, 0))
  RETURNING id INTO v_grant_id;

  PERFORM grant_credits(v_order.user_id, 'contact', COALESCE((v_sku->>'contact_credits')::integer, 0), 'purchase', p_provider_payment_id);
  PERFORM grant_credits(v_order.user_id, 'ai', COALESCE((v_sku->>'ai_credits')::integer, 0), 'purchase', p_provider_payment_id);

  RETURN jsonb_build_object('granted', true, 'already_granted', false, 'payment_id', v_payment_id, 'grant_id', v_grant_id);
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- accept_generated_proposal (§18.1)
-- Version-check current draft, apply proposal, invalidate stale approvals.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_generated_proposal(
  p_generation_id uuid,
  p_user_id uuid,
  p_expected_version integer
) RETURNS jsonb AS $$
DECLARE
  v_gen record;
  v_draft record;
  v_proposed record;
  v_new_revision_no integer;
  v_revision_id uuid;
BEGIN
  SELECT * INTO v_gen FROM generation_requests WHERE id = p_generation_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'GENERATION_NOT_FOUND'; END IF;
  IF v_gen.state <> 'ready' OR v_gen.proposed_revision_id IS NULL THEN
    RAISE EXCEPTION 'GENERATION_NOT_READY';
  END IF;
  IF v_gen.acceptance_state <> 'pending' THEN
    RAISE EXCEPTION 'GENERATION_ALREADY_%', upper(v_gen.acceptance_state);
  END IF;

  SELECT * INTO v_draft FROM drafts WHERE id = v_gen.draft_id FOR UPDATE;
  IF v_draft.current_version <> p_expected_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT';
  END IF;

  SELECT * INTO v_proposed FROM draft_revisions WHERE id = v_gen.proposed_revision_id;
  SELECT COALESCE(MAX(revision_no), 0) + 1 INTO v_new_revision_no
  FROM draft_revisions WHERE draft_id = v_draft.id;

  INSERT INTO draft_revisions (draft_id, user_id, revision_no, subject, body, recipient_snapshot, resume_id, profile_revision_id, generation_id, content_hash)
  VALUES (v_draft.id, p_user_id, v_new_revision_no, v_proposed.subject, v_proposed.body,
          v_proposed.recipient_snapshot, v_proposed.resume_id, v_proposed.profile_revision_id, v_gen.id, v_proposed.content_hash)
  RETURNING id INTO v_revision_id;

  UPDATE drafts
  SET current_revision_id = v_revision_id, current_version = current_version + 1, updated_at = now(),
      list_subject = v_proposed.subject
  WHERE id = v_draft.id;

  UPDATE generation_requests SET acceptance_state = 'accepted', completed_at = now() WHERE id = p_generation_id;

  -- Changed content invalidates prior approvals (§13.6).
  UPDATE draft_approvals SET state = 'invalidated', invalidated_at = now()
  WHERE draft_id = v_draft.id AND state = 'active';

  RETURN jsonb_build_object('revision_id', v_revision_id, 'version', v_draft.current_version + 1);
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- claim_job / complete_job / schedule_job_retry (§20.2)
-- Lease/fencing/state-checked job transitions. Expired-lease running jobs
-- are reclaimable (recovery sweep).
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_job(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer,
  p_deadline_seconds integer
) RETURNS jsonb AS $$
DECLARE
  v_job record;
  v_token integer;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_job.state NOT IN ('queued', 'retry_wait', 'deferred')
     AND NOT (v_job.state = 'running' AND (v_job.lease_owner IS NULL OR v_job.lease_expires_at <= now())) THEN
    RETURN NULL;
  END IF;
  IF v_job.lease_owner IS NOT NULL AND v_job.lease_expires_at > now() THEN RETURN NULL; END IF;

  v_token := v_job.fencing_token + 1;
  UPDATE jobs
  SET state = 'running', lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      fencing_token = v_token,
      attempts = attempts + 1,
      -- Deadline is per-attempt, not per-job. It used to be COALESCE(deadline_at,
      -- ...), which froze the budget at first claim: a generation that was
      -- legitimately retrying on a backoff would trip recoverySweep's deadline
      -- breach while retries were still pending, get marked needs_attention,
      -- and have its credit released out from under a live job.
      deadline_at = now() + make_interval(secs => p_deadline_seconds),
      updated_at = now()
  WHERE id = p_job_id;

  RETURN jsonb_build_object('fencing_token', v_token, 'attempts', v_job.attempts + 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_job(
  p_job_id uuid,
  p_fencing_token integer,
  p_state text,
  p_result jsonb DEFAULT NULL,
  p_error_code text DEFAULT NULL,
  p_error_message text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_job record;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_job.fencing_token <> p_fencing_token THEN RETURN false; END IF; -- stale worker
  IF v_job.state <> 'running' THEN RETURN false; END IF;

  UPDATE jobs
  SET state = p_state, last_result = p_result,
      error_code = p_error_code, error_message = p_error_message,
      lease_owner = NULL, lease_expires_at = NULL, updated_at = now()
  WHERE id = p_job_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION schedule_job_retry(
  p_job_id uuid,
  p_fencing_token integer,
  p_available_after timestamptz
) RETURNS boolean AS $$
BEGIN
  UPDATE jobs
  SET state = 'retry_wait', available_after = p_available_after,
      lease_owner = NULL, lease_expires_at = NULL, updated_at = now()
  WHERE id = p_job_id AND fencing_token = p_fencing_token AND state = 'running';
  IF NOT FOUND THEN RETURN false; END IF;

  -- Uniquely scheduled retry outbox event (§20.2 step 9).
  INSERT INTO outbox_events (kind, payload)
  VALUES ('job.retry', jsonb_build_object('job_id', p_job_id));
  RETURN true;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- admit_operation / acquire_concurrency_slot (§22.4)
-- Atomic durable quota + concurrency admission across replicas.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admit_operation(
  p_env text,
  p_operation_kind text,
  p_principal text,
  p_operation_ref text,
  p_limit integer,
  p_window_start timestamptz
) RETURNS boolean AS $$
DECLARE
  v_window_id uuid;
  v_admitted integer;
  v_existing record;
BEGIN
  SELECT * INTO v_existing FROM operation_admissions WHERE operation_ref = p_operation_ref;
  IF FOUND THEN
    RETURN v_existing.state = 'admitted';
  END IF;

  INSERT INTO quota_windows (env, operation_kind, principal, window_start, limit_count)
  VALUES (p_env, p_operation_kind, p_principal, p_window_start, p_limit)
  ON CONFLICT (env, operation_kind, principal, window_start) DO NOTHING;

  SELECT id INTO v_window_id FROM quota_windows
  WHERE env = p_env AND operation_kind = p_operation_kind AND principal = p_principal AND window_start = p_window_start;

  SELECT admitted INTO v_admitted FROM quota_windows WHERE id = v_window_id FOR UPDATE;

  IF v_admitted >= p_limit THEN
    INSERT INTO operation_admissions (operation_ref, quota_scope, window_id, state)
    VALUES (p_operation_ref, p_operation_kind || ':' || p_principal, v_window_id, 'rejected');
    RETURN false;
  END IF;

  UPDATE quota_windows SET admitted = admitted + 1 WHERE id = v_window_id;
  INSERT INTO operation_admissions (operation_ref, quota_scope, window_id, state)
  VALUES (p_operation_ref, p_operation_kind || ':' || p_principal, v_window_id, 'admitted');
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION acquire_concurrency_slot(
  p_scope text,
  p_operation_ref text,
  p_lease_seconds integer
) RETURNS boolean AS $$
DECLARE
  v_count integer;
  v_limit integer;
BEGIN
  v_limit := CASE split_part(p_scope, ':', 1)
    WHEN 'ai' THEN 2
    WHEN 'gmail' THEN 1
    ELSE 10
  END;

  -- Clean expired leases for this scope family.
  UPDATE concurrency_slots SET released_at = now()
  WHERE resource_scope LIKE p_scope || '%'
    AND resource_scope LIKE split_part(p_scope, ':', 1) || ':%'
    AND lease_expires_at < now() AND released_at IS NULL;

  SELECT COUNT(*) INTO v_count FROM concurrency_slots
  WHERE resource_scope LIKE split_part(p_scope, ':', 1) || ':%' AND released_at IS NULL;

  IF v_count >= v_limit THEN RETURN false; END IF;

  INSERT INTO concurrency_slots (resource_scope, owner_operation_ref, lease_expires_at)
  VALUES (p_scope, p_operation_ref, now() + make_interval(secs => p_lease_seconds))
  ON CONFLICT (resource_scope, owner_operation_ref)
  DO UPDATE SET lease_expires_at = now() + make_interval(secs => p_lease_seconds), released_at = NULL;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------
-- verify_credit_consistency (§18.2): per-lot conservation and
-- account-vs-lot sums must hold. Returns mismatching rows.
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_credit_consistency(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, type text, issue text) AS $$
BEGIN
  RETURN QUERY
  SELECT l.user_id, l.type, 'lot_conservation'::text
  FROM credit_lots l
  WHERE (p_user_id IS NULL OR l.user_id = p_user_id)
    AND l.granted <> l.available + l.reserved + l.consumed + l.reversed;

  RETURN QUERY
  SELECT a.user_id, a.type, 'account_vs_lots'::text
  FROM credit_accounts a
  WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (a.available, a.reserved) <> (
      SELECT COALESCE(SUM(l.available), 0), COALESCE(SUM(l.reserved), 0)
      FROM credit_lots l WHERE l.user_id = a.user_id AND l.type = a.type
    );
END;
$$ LANGUAGE plpgsql;
