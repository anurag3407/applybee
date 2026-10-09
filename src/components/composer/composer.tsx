"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Download, Sparkles, ShieldCheck, AlertTriangle, RefreshCw, Mail, FileDown, KanbanSquare } from "lucide-react";
import { Button, Badge, InlineError, Textarea, Input, Label, Select } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import { wordCount } from "@/lib/format";

/**
 * Shared composer (§13): one editor and domain model across Manual, Quick AI,
 * and Agentic modes. Version-checked autosave; explicit credit costs; no Send
 * button anywhere. Delivery states distinguish created / failed / unknown.
 */

export type ComposerProps = {
  draftId: string;
  initial: {
    subject: string;
    body: string;
    version: number;
    mode: "manual" | "quick_ai" | "agentic";
    intent: string;
  };
  recipient: {
    kind: "directory" | "own";
    name?: string | null;
    title?: string | null;
    companyName?: string | null;
    email?: string | null;
    unlocked?: boolean;
    contactId?: string;
  } | null;
  balances: { contact: { available: number; reserved: number }; ai: { available: number; reserved: number } };
  gmail: { connected: boolean; email?: string | null; mode: string } | null;
  hasApprovedProfile: boolean;
  /** `users.display_name`; empty means the draft has no signature name to use. */
  candidateName: string;
  /** Target role from the confirmed profile, so a reload keeps the grounding. */
  profileTargetRole?: string;
  /** A newer, still-unconfirmed profile revision (usually a fresh resume parse). */
  pendingProfileReview?: { revisionId: string; factCount: number } | null;
  resumeOptions: Array<{ id: string; name: string; scanned: boolean }>;
  initialGeneration?: {
    id: string;
    state: string;
    acceptanceState?: string;
    proposedRevisionId?: string | null;
    failureCode?: string | null;
    failureMessage?: string | null;
    proposal?: {
      subject: string;
      body: string;
      claims?: GroundingClaim[];
      profileRevision?: ProfileRevisionLabel;
    } | null;
    usage?: { factsUsed?: number; warnings?: string[] } | null;
  } | null;
  initialDelivery?: DeliveryState;
};

/**
 * One sentence of the draft, with the confirmed facts the server validated it
 * against. Persisted by `draft.generate` as `draft_claims`; surfaced here so the
 * "only your confirmed details" promise can be checked rather than trusted.
 */
export type GroundingClaim = {
  excerpt: string;
  result: "supported" | "unsupported" | "uncertain";
  facts: Array<{ id: string; factType: string; text: string }>;
  evidence: Array<{ id: string; value: string; sourceName: string | null }>;
};

/** Which confirmed profile revision the draft was grounded in. */
export type ProfileRevisionLabel = { revisionNo: number; source: string } | null;

const REVISION_SOURCE: Record<string, string> = {
  resume: "from your resume",
  manual: "typed by you",
};

type GenerationState = {
  id: string;
  state: string;
  acceptanceState?: string;
  proposedRevisionId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
} | null;

type DeliveryState = {
  id: string;
  state: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  providerDraftId?: string | null;
} | null;

// Grounding caveats the model returned with a validated draft. They say which
// part of the snapshot the AI was missing, so an ungrounded draft is never
// presented identically to a fully grounded one — and each one points at the fix
// instead of ending as a sentence the user has to interpret.
const WARNING_HELP: Record<string, { copy: string; label: string; href?: string; focus?: string }> = {
  missing_company_context: {
    copy: "No approved company evidence — this was written from your facts and the role only.",
    label: "Review company evidence",
    href: "/app/contacts",
  },
  weak_match: {
    copy: "Only a weak overlap with this role — re-read the claims before sending.",
    label: "Add more confirmed facts",
    href: "/app/profile",
  },
  missing_role_context: {
    copy: "No target role was set, so the ask is generic.",
    label: "Add the role",
    focus: "targetRole",
  },
  placeholder_text: {
    copy: "This still has a fill-in placeholder — replace it before sending.",
    label: "Fix it in the message",
    focus: "body",
  },
};

function GroundingNotes({
  warnings,
  contactId,
  onFocusField,
}: {
  warnings: string[];
  contactId?: string;
  onFocusField: (id: string) => void;
}) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {warnings.map((code) => {
        const help = WARNING_HELP[code];
        if (!help) return <li key={code} className="text-xs text-warning">{code}</li>;
        const href = code === "missing_company_context" && contactId ? `/app/contacts/${contactId}` : help.href;
        return (
          <li key={code} className="rounded-control bg-warning-wash/60 px-2.5 py-1.5 text-xs text-warning">
            <span className="flex items-start gap-1.5">
              <AlertTriangle size={13} aria-hidden className="mt-0.5 shrink-0" />
              <span>{help.copy}</span>
            </span>
            {href ? (
              <Link href={href} className="mt-1 inline-block pl-[19px] font-bold underline">
                {help.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onFocusField(help.focus!)}
                className="mt-1 inline-block pl-[19px] text-xs font-bold text-warning underline"
              >
                {help.label}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Per-claim evidence for a proposal. `uncertain` is what the validator recorded
 * when no confirmed fact backed the sentence — those are the lines to re-read.
 */
function GroundingPanel({ claims }: { claims: GroundingClaim[] }) {
  if (claims.length === 0) return null;
  const uncertain = claims.filter((c) => c.result !== "supported").length;
  return (
    <div className="rounded-control border border-border-decorative bg-canvas p-3">
      <p className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-text-disabled">
        <span>Why this is in the draft</span>
        <span className="font-semibold normal-case tracking-normal text-text-secondary">
          {claims.length - uncertain}/{claims.length} backed by a confirmed fact
        </span>
      </p>
      <ul className="mt-2 space-y-2">
        {claims.map((claim, i) => (
          <li key={i} className="text-xs">
            <p className="italic text-ink">&ldquo;{claim.excerpt}&rdquo;</p>
            {claim.facts.length > 0 || claim.evidence.length > 0 ? (
              <ul className="mt-1 space-y-0.5 pl-3 text-text-secondary">
                {claim.facts.map((f) => (
                  <li key={f.id} className="flex gap-1.5">
                    <Check size={12} aria-hidden className="mt-1 shrink-0 text-success" />
                    <span>{f.text}</span>
                  </li>
                ))}
                {claim.evidence.map((e) => (
                  <li key={e.id} className="flex gap-1.5">
                    <Check size={12} aria-hidden className="mt-1 shrink-0 text-success" />
                    <span>
                      {e.value}
                      {e.sourceName ? <span className="text-text-disabled"> · {e.sourceName}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-warning">
                <AlertTriangle size={12} aria-hidden />
                Nothing you confirmed backs this — check the wording.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The daily ceiling, in the shape a waiting user can act on. */
function formatCountdown(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Defensive JSON read. An error page is not always JSON — a proxy 502 or an
 * HTML 500 used to make `res.json()` throw and surface a raw SyntaxError string
 * in a red box, which reads like a broken app rather than a failed request.
 */
async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** The quota window is a fixed UTC bucket, so it closes at the next UTC midnight. */
function nextUtcReset(from: number): Date {
  const d = new Date(from);
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

type FactType = "achievement" | "project" | "experience" | "skill" | "education";

const FACT_TYPES: Array<{ value: FactType; label: string }> = [
  { value: "achievement", label: "Something I achieved" },
  { value: "project", label: "A project I built" },
  { value: "experience", label: "Where I have worked" },
  { value: "skill", label: "A skill I have used" },
  { value: "education", label: "What I studied" },
];

/**
 * The one gate in front of AI drafting, asked honestly: the user supplies the
 * sentence, so "confirmed" means confirmed. Rendered exactly once per card so the
 * field ids stay unique.
 */
function ProfileGate(p: {
  nameValue: string;
  onName: (v: string) => void;
  roleValue: string;
  onRole: (v: string) => void;
  factType: FactType;
  onFactType: (v: FactType) => void;
  fact: string;
  onFact: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  note: string | null;
}) {
  return (
    <div className="mt-2 space-y-2.5 rounded-control bg-warning-wash/70 p-3">
      <p className="text-xs font-semibold text-warning">
        AI writes only from details you have confirmed. Add these — it takes about 15 seconds.
      </p>
      <div>
        <Label htmlFor="confirm-name">Your name (goes in the greeting and sign-off)</Label>
        <Input
          id="confirm-name"
          value={p.nameValue}
          onChange={(e) => p.onName(e.target.value)}
          maxLength={120}
          placeholder="Sam Iyer"
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="confirm-role">Target role (optional)</Label>
        <Input
          id="confirm-role"
          value={p.roleValue}
          onChange={(e) => p.onRole(e.target.value)}
          maxLength={120}
          placeholder="e.g. Backend engineer"
        />
      </div>
      <div>
        <Label htmlFor="confirm-type">This fact is about</Label>
        <Select id="confirm-type" value={p.factType} onChange={(e) => p.onFactType(e.target.value as FactType)}>
          {FACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="confirm-fact">The fact</Label>
        <Textarea
          id="confirm-fact"
          rows={3}
          maxLength={600}
          value={p.fact}
          onChange={(e) => p.onFact(e.target.value)}
          placeholder="I cut p99 latency 40% on a payments service at my last job."
          className="font-[inherit]"
        />
        <p className="mt-1 text-[11px] leading-snug text-text-disabled">
          Only what is true. The AI cannot use anything you have not confirmed here.
        </p>
      </div>
      {p.note ? (
        <p className="text-xs text-danger" role="alert">
          {p.note}
        </p>
      ) : null}
      <Button size="sm" variant="accent" onClick={p.onSubmit} disabled={p.busy} className="w-full justify-center">
        <Check size={13} aria-hidden />
        {p.busy ? "Saving…" : "Confirm and unlock AI"}
      </Button>
      <p className="text-xs text-text-secondary">
        Or <Link href="/app/profile" className="underline">upload a resume</Link> and confirm the facts it extracts.
      </p>
    </div>
  );
}

const INTENTS = [
  { value: "advertised_role", label: "Advertised role" },
  { value: "internship", label: "Internship" },
  { value: "intro", label: "Speculative intro" },
  { value: "referral", label: "Referral request" },
  { value: "follow_up", label: "Follow-up" },
];

/**
 * Daily AI draft ceiling, mirrored from LIMITS.aiGenerateDaily in
 * src/server/adapters/ratelimit.ts. Display only — the server is authoritative.
 * The window is a fixed UTC bucket (the quota table keys on window_start), so it
 * resets at midnight UTC rather than 24h after the first draft.
 */
const AI_DRAFTS_PER_DAY = 10;

export function Composer({ draftId, initial, recipient, balances, gmail, hasApprovedProfile, candidateName, profileTargetRole, pendingProfileReview, resumeOptions, initialGeneration, initialDelivery }: ComposerProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [version, setVersion] = useState(initial.version);
  const [mode, setMode] = useState(initial.mode);
  const [intent, setIntent] = useState(initial.intent);
  // Seeded from the confirmed profile: a reload used to blank this field, so a
  // second generation silently lost the role context the first one had.
  const [targetRole, setTargetRole] = useState(profileTargetRole ?? "");
  const [jobDescription, setJobDescription] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationState>(initialGeneration ?? null);
  const [proposal, setProposal] = useState<{
    subject: string;
    body: string;
    factIds: number;
    warnings: string[];
    claims: GroundingClaim[];
    profileRevision: ProfileRevisionLabel;
  } | null>(
    initialGeneration?.proposal
      ? {
          ...initialGeneration.proposal,
          factIds: initialGeneration.usage?.factsUsed ?? 0,
          warnings: initialGeneration.usage?.warnings ?? [],
          claims: initialGeneration.proposal.claims ?? [],
          profileRevision: initialGeneration.proposal.profileRevision ?? null,
        }
      : null,
  );
  const [delivery, setDelivery] = useState<DeliveryState>(initialDelivery ?? null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pollSource, setPollSource] = useState<AbortController | null>(null);
  const [profileReady, setProfileReady] = useState(hasApprovedProfile);
  const [profileActivating, setProfileActivating] = useState(false);
  const [confirmName, setConfirmName] = useState(candidateName);
  const [confirmFact, setConfirmFact] = useState("");
  const [confirmFactType, setConfirmFactType] = useState<FactType>("achievement");
  const [confirmRole, setConfirmRole] = useState("");
  const [profileNote, setProfileNote] = useState<string | null>(null);
  // The server answers a throttled Generate with Retry-After; before this it was
  // discarded, so "please wait a minute" arrived with no clock and the only way
  // to find out was to click again.
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [throttleCode, setThrottleCode] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!retryUntil) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [retryUntil]);

  const retrySecondsLeft = retryUntil ? Math.max(0, Math.ceil((retryUntil - nowTick) / 1000)) : 0;
  const throttled = retrySecondsLeft > 0;

  /**
   * Set after mount, never during render. `toLocaleTimeString` reads the machine's
   * timezone, so a UTC server and an IST browser disagree, and formatting it in
   * the server render produced a hydration mismatch on every composer page.
   */
  const [quotaResetsAt, setQuotaResetsAt] = useState<string | null>(null);
  useEffect(() => {
    setQuotaResetsAt(
      // hour12 keeps the day period explicit; without it some browser locales
      // rendered the reset as a bare "5:30", which is not a time anyone can act on.
      nextUtcReset(Date.now()).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }),
    );
  }, []);

  /**
   * Unlock AI drafting with something the user actually typed.
   *
   * This used to be "1-Click Activate AI Profile", which POSTed a sentence the
   * user never wrote — `Software engineering professional targeting …
   * opportunities.` — with `approve: true`. It opened the NO_CONFIRMED_FACTS gate
   * instantly and permanently broke the product's one promise, because every
   * draft afterwards was grounded in an unconfirmed claim. The shortcut now costs
   * one typed sentence and approves only what the user supplied.
   */
  async function confirmProfileFact() {
    const name = confirmName.trim();
    if (name.length < 2) {
      setProfileNote("Add the name to greet and sign off with — a draft cannot be written without one.");
      return;
    }
    const text = confirmFact.trim();
    if (text.length < 12) {
      setProfileNote("Write a full sentence — “TypeScript” is too thin for the AI to write from.");
      return;
    }
    setProfileActivating(true);
    setProfileNote(null);
    setActionError(null);
    try {
      // The greeting and the sign-off come from `users.display_name`, which an
      // account can simply not have; drafting then wrote "I'm ." into a real
      // email. Save the name first so the snapshot the model sees has it.
      const prefs = await fetch("/api/v1/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const prefsData = await readJson<{ error?: { message?: string } }>(prefs);
      if (!prefs.ok) throw new Error(prefsData?.error?.message ?? "Could not save your name.");

      const res = await fetch("/api/v1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(confirmRole.trim() ? { targetRole: confirmRole.trim() } : {}),
          facts: [{ factType: confirmFactType, text }],
          approve: true,
        }),
      });
      const data = await readJson<{ error?: { message?: string } }>(res);
      if (!res.ok) throw new Error(data?.error?.message ?? "Could not save that fact.");
      setProfileReady(true);
      setConfirmFact("");
      router.refresh();
    } catch (err) {
      setProfileNote(err instanceof Error ? err.message : "Could not save that fact.");
    } finally {
      setProfileActivating(false);
    }
  }

  const savedVersion = useRef(version);
  const dirtyRef = useRef(false);

  /* Autosave: debounce 800ms; flush on approval; version-checked. */
  const save = useCallback(
    async (payload: { subject: string; body: string; expectedVersion: number; intent?: string; mode?: string }): Promise<"ok" | "conflict" | "error"> => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/v1/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedVersion: payload.expectedVersion,
            subject: payload.subject,
            body: payload.body,
            ...(payload.intent ? { intent: payload.intent } : {}),
            ...(payload.mode ? { mode: payload.mode } : {}),
          }),
        });
        if (res.status === 409) {
          setSaveState("conflict");
          setConflictOpen(true);
          return "conflict";
        }
        if (!res.ok) throw new Error("SAVE_FAILED");
        const data = (await res.json()) as { data: { version: number } };
        savedVersion.current = data.data.version;
        setVersion(data.data.version);
        setSaveState("saved");
        return "ok";
      } catch {
        setSaveState("error");
        return "error";
      }
    },
    [draftId],
  );

  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => {
      void save({ subject, body, expectedVersion: savedVersion.current, intent, mode });
      dirtyRef.current = false;
    }, 800);
    return () => clearTimeout(t);
  }, [subject, body, intent, mode, save]);

  function markDirty() {
    dirtyRef.current = true;
    setSaveState("idle");
  }

  /* Recipient: a draft created from the dashboard's "Create an introduction"
     button starts with none, and without this the primary call to action
     dead-ended — the composer told users to choose a recipient but offered no
     control to do it, so nothing could be generated. */
  const [rcptName, setRcptName] = useState("");
  const [rcptEmail, setRcptEmail] = useState("");
  const [rcptBusy, setRcptBusy] = useState(false);
  const [rcptError, setRcptError] = useState<string | null>(null);
  const [editingRcpt, setEditingRcpt] = useState(false);

  async function patchRecipient(recipient: Record<string, unknown>) {
    setRcptBusy(true);
    setRcptError(null);
    try {
      const res = await fetch(`/api/v1/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: savedVersion.current, recipient }),
      });
      if (!res.ok) {
        setRcptError("We couldn't save that recipient. Please try again.");
        return false;
      }
      const data = (await res.json()) as { data?: { version: number } };
      if (data.data?.version) {
        savedVersion.current = data.data.version;
        setVersion(data.data.version);
      }
      return true;
    } catch {
      setRcptError("We couldn't save that recipient. Please try again.");
      return false;
    } finally {
      setRcptBusy(false);
      router.refresh();
    }
  }

  async function setOwnRecipient() {
    const email = rcptEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRcptError("Enter a valid email address.");
      return;
    }
    const okSave = await patchRecipient({
      kind: "own",
      email,
      name: rcptName.trim() || undefined,
    });
    if (okSave) {
      setRcptEmail("");
      setRcptName("");
      setEditingRcpt(false);
    }
  }

  // Cancel any in-flight polling when this draft is left or a new poll starts.
  // Without this the AbortController was created but never aborted, so the
  // loop kept fetching (and setting state) after unmount.
  useEffect(() => () => pollSource?.abort(), [pollSource]);

  /* Polling: 2s → 5s → 10s while the job is alive (§20.5).
   *
   * The window has to outlast the server's own budget or the user is charged for
   * a draft they never see: `draft.generate` gets 4 attempts, each able to make
   * two provider calls with a 60s timeout, plus backoff — roughly 9 minutes. The
   * old 20-poll (~187s) cutoff expired while the job was still running, and
   * because the credit is consumed when the artifact commits, a successful late
   * attempt landed in a screen that had stopped looking.
   */
  const POLL_LIMIT = 60;

  const pollGeneration = useCallback(
    async (generationId: string) => {
      let delay = 2000;
      const controller = new AbortController();
      setPollSource(controller);
      let polls = 0;
      while (!controller.signal.aborted && polls < POLL_LIMIT) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2.5, 10_000);
        if (document.hidden) continue;
        polls++;
        try {
          const res = await fetch(`/api/v1/generations/${generationId}`, { signal: controller.signal });
          // A vanished or unauthenticated resource is final; anything else is a
          // blip and the next poll picks it up. Breaking on the first 500 used to
          // abandon a generation that was about to succeed.
          if (res.status === 401 || res.status === 403 || res.status === 404) break;
          if (!res.ok) continue;
          const data = await readJson<{
            data: GenerationState & {
              id: string;
              proposal?: {
                subject: string;
                body: string;
                claims?: GroundingClaim[];
                profileRevision?: ProfileRevisionLabel;
              } | null;
              usage?: { factsUsed?: number; warnings?: string[] } | null;
            };
          }>(res);
          if (!data) continue;
          setGeneration(data.data);
          if (data.data.state === "ready" && data.data.proposal) {
            setProposal({
              subject: data.data.proposal.subject,
              body: data.data.proposal.body,
              factIds: data.data.usage?.factsUsed ?? 0,
              warnings: data.data.usage?.warnings ?? [],
              claims: data.data.proposal.claims ?? [],
              profileRevision: data.data.proposal.profileRevision ?? null,
            });
          }
          if (["ready", "failed", "released", "cancelled"].includes(data.data.state)) {
            // Resync the server-rendered chrome (credit balances, draft status)
            // so the rest of the page agrees with what just happened.
            router.refresh();
            return;
          }
        } catch {
          continue;
        }
      }
      if (!controller.signal.aborted) {
        setActionError(
          "Still writing — the model is slow right now, not stuck. Keep this tab open, or reopen the draft in a few minutes and the draft will be here.",
        );
      }
    },
    [router],
  );

  // A generation started elsewhere (or one the previous poll gave up on) is still
  // owned by this draft. Without this the editor mounted into "Writing your
  // introduction…" and never looked again, so the finished draft stayed invisible
  // until a manual reload.
  useEffect(() => {
    if (!initialGeneration) return;
    if (!GENERATION_IN_FLIGHT_STATES.includes(initialGeneration.state)) return;
    void pollGeneration(initialGeneration.id);
    // Mount-only: the guard above keys off the server-provided state, and the
    // cleanup on pollSource aborts this loop when a newer one starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startGeneration() {
    setActionError(null);
    // Flush pending edits first so the snapshot includes them. The outcome has
    // to come from this call's return value — reading `saveState` here would be
    // a stale closure from the render that started this handler, so a version
    // conflict would slip through and the AI would draft from the last saved
    // revision rather than what the user is looking at.
    const flush = await save({ subject, body, expectedVersion: savedVersion.current, intent, mode });
    if (flush === "conflict") {
      setActionError("This draft changed in another tab. Resolve the conflict before generating.");
      return;
    }
    if (flush === "error") {
      setActionError("We couldn't save your latest edits. Generate is paused so nothing is lost.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/drafts/${draftId}/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          intent,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription || undefined,
          tone: "warm_professional",
          length: { target: 90 },
        }),
      });
      const data = await readJson<{
        data?: { generationId: string };
        error?: { code?: string; message?: string };
      }>(res);
      if (!res.ok || !data?.data) {
        const retryAfter = Number(res.headers.get("retry-after"));
        setRetryUntil(Number.isFinite(retryAfter) && retryAfter > 0 ? Date.now() + retryAfter * 1000 : null);
        setThrottleCode(res.ok ? null : (data?.error?.code ?? null));
        throw new Error(data?.error?.message ?? "Generation could not start. Please try again.");
      }
      setRetryUntil(null);
      setThrottleCode(null);
      setGeneration({ id: data.data.generationId, state: "queued" });
      void pollGeneration(data.data.generationId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Generation could not start.");
    } finally {
      setBusy(false);
    }
  }

  const [busy, setBusy] = useState(false);

  async function acceptProposal() {
    if (!generation) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/generations/${generation.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: savedVersion.current, action: "accept" }),
      });
      const data = (await res.json()) as { data?: { version: number }; error?: { code?: string; message?: string } };
      if (!res.ok || !data.data) {
        if (data.error?.code === "VERSION_CONFLICT") {
          setSaveState("conflict");
          setConflictOpen(true);
          return;
        }
        throw new Error(data.error?.message ?? "Could not apply the draft.");
      }
      setVersion(data.data.version);
      savedVersion.current = data.data.version;
      // Reload full content after acceptance.
      const res2 = await fetch(`/api/v1/drafts/${draftId}`);
      const data2 = (await res2.json()) as { data: { subject: string; body: string } };
      setSubject(data2.data.subject);
      setBody(data2.data.body);
      setProposal(null);
      setGeneration({ ...generation, state: "ready", acceptanceState: "accepted" });
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not apply the draft.");
    } finally {
      setBusy(false);
    }
  }

  async function dismissProposal() {
    if (!generation) return;
    await fetch(`/api/v1/generations/${generation.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedVersion: savedVersion.current, action: "dismiss" }),
    });
    setProposal(null);
    setGeneration({ ...generation, acceptanceState: "dismissed" });
  }

  /* Delivery: approval → delivery → poll. */
  async function approveAndDeliver() {
    setBusy(true);
    setActionError(null);
    try {
      // Flush latest content first: approval covers the current version.
      const flush = await save({ subject, body, expectedVersion: savedVersion.current, intent, mode });
      if (flush !== "ok") throw new Error("Save your draft first — it changed and needs a clean save.");
      const approval = await fetch(`/api/v1/drafts/${draftId}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentResumeId: attachmentId }),
      });
      const approvalData = (await approval.json()) as { data?: { approvalId: string }; error?: { message?: string } };
      if (!approval.ok || !approvalData.data) throw new Error(approvalData.error?.message ?? "Approval failed.");
      const deliveryRes = await fetch(`/api/v1/drafts/${draftId}/approvals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: approvalData.data.approvalId }),
      });
      const deliveryData = (await deliveryRes.json()) as { data?: { deliveryId: string }; error?: { message?: string } };
      if (!deliveryRes.ok || !deliveryData.data) throw new Error(deliveryData.error?.message ?? "Delivery could not start.");
      const deliveryId = deliveryData.data.deliveryId;
      setDelivery({ id: deliveryId, state: "queued" });
      setApprovalOpen(false);
      // Poll delivery
      let delay = 2000;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 10_000);
        const status = await fetch(`/api/v1/gmail-deliveries/${deliveryId}`);
        if (!status.ok) break;
        const body = (await status.json()) as { data: DeliveryState & { id: string } };
        setDelivery(body.data);
        if (!["queued", "preparing", "calling_provider", "unknown", "reconciling"].includes(body.data.state)) break;
        if (["unknown", "reconciling"].includes(body.data.state) && i > 6) break;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delivery failed.");
    } finally {
      setBusy(false);
    }
  }

  async function reconcile() {
    if (!delivery) return;
    await fetch(`/api/v1/gmail-deliveries/${delivery.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reconcile" }),
    });
    setActionError(null);
    setDelivery({ ...delivery, state: "reconciling" });
  }

  async function recreate() {
    if (!delivery) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/gmail-deliveries/${delivery.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recreate", draftId }),
      });
      const data = (await res.json()) as { data?: { deliveryId: string }; error?: { message?: string } };
      if (!res.ok || !data.data) throw new Error(data.error?.message ?? "Recreate failed.");
      setDelivery({ id: data.data.deliveryId, state: "queued" });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Recreate failed.");
    } finally {
      setBusy(false);
    }
  }

  const words = useMemo(() => wordCount(body), [body]);
  // A generation in flight owns the draft: the server sets the draft to
// "generating" and rejects a second start, so leaving the button live turned a
// double-click into a confusing "This draft can no longer be edited".
const GENERATION_IN_FLIGHT_STATES = ["queued", "reserved", "preparing", "generating"];
const generationInFlight =
  generation !== null && GENERATION_IN_FLIGHT_STATES.includes(generation.state);
const canGenerate = balances.ai.available > 0 && recipient !== null && !generationInFlight && profileReady;

  function focusField(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
      {/* Left context rail */}
      <aside className="order-2 space-y-4 xl:order-1">
        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-text-disabled">Recipient</h3>
          {recipient && !editingRcpt ? (
            <div className="mt-2 text-sm">
              <p className="font-bold text-ink">{recipient.name ?? recipient.email}</p>
              {recipient.title ? <p className="text-text-secondary">{recipient.title}</p> : null}
              {recipient.companyName ? <p className="text-text-secondary">{recipient.companyName}</p> : null}
              {recipient.kind === "directory" && !recipient.unlocked ? (
                <Badge tone="warning">Email locked — reveal in directory before Gmail delivery</Badge>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-ink underline"
                  disabled={rcptBusy}
                  onClick={() => {
                    setRcptError(null);
                    setEditingRcpt(true);
                  }}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-text-secondary underline"
                  disabled={rcptBusy}
                  onClick={async () => {
                    if (await patchRecipient({ kind: "none" })) setEditingRcpt(false);
                  }}
                >
                  {rcptBusy ? "Clearing…" : "Clear"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-text-secondary">
                Choose who this is for. Without a recipient you can still write manually.
              </p>
              <div>
                <Label htmlFor="rcpt-name">Name (optional)</Label>
                <Input
                  id="rcpt-name"
                  value={rcptName}
                  onChange={(e) => setRcptName(e.target.value)}
                  placeholder="Priya Sharma"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="rcpt-email">Email</Label>
                <Input
                  id="rcpt-email"
                  type="email"
                  value={rcptEmail}
                  onChange={(e) => setRcptEmail(e.target.value)}
                  placeholder="priya@company.com"
                  autoComplete="off"
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void setOwnRecipient()}
                disabled={rcptBusy}
              >
                {rcptBusy ? "Saving…" : "Set recipient"}
              </Button>
              <p className="text-xs text-text-disabled">
                Or{" "}
                <Link href="/app/contacts" className="underline">
                  pick someone from the directory
                </Link>{" "}
                to use a verified work address.
              </p>
              {recipient && editingRcpt ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-text-secondary underline"
                  onClick={() => {
                    setRcptError(null);
                    setEditingRcpt(false);
                  }}
                >
                  Cancel
                </button>
              ) : null}
              {rcptError ? (
                <p className="text-xs text-danger" role="alert">{rcptError}</p>
              ) : null}
            </div>
          )}
        </div>
        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <Label htmlFor="intent">Intent</Label>
          <Select
            id="intent"
            value={intent}
            onChange={(e) => {
              setIntent(e.target.value);
              markDirty();
            }}
          >
            {INTENTS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </Select>
          {intent === "follow_up" ? (
            <p className="mt-2 rounded-control bg-warning-wash px-2.5 py-1.5 text-xs text-warning">
              Follow-ups need your confirmed prior outreach — the draft won’t claim an email was sent unless you say so.
            </p>
          ) : null}
        </div>
        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <Label htmlFor="targetRole">Target role (optional)</Label>
          <Input id="targetRole" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={120} placeholder="e.g. Platform engineer" />
          <Label htmlFor="jobDescription" className="mt-3">Job description (optional)</Label>
          <Textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            maxLength={20000}
            placeholder="Paste the posting text. Treated as data — never as instructions."
          />
        </div>
      </aside>

      {/* Center editor */}
      <section className="order-1 space-y-3 xl:order-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label="Writing mode" className="flex gap-1 rounded-control border border-border-decorative bg-surface p-1">
            {(["manual", "quick_ai", "agentic"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  markDirty();
                }}
                className={`min-h-9 rounded-control px-3 text-sm font-semibold ${
                  mode === m ? "bg-ink text-surface" : "text-text-secondary hover:bg-surface-subtle"
                }`}
              >
                {m === "manual" ? "Manual" : m === "quick_ai" ? "Quick AI" : "Agentic"}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="text-xs font-semibold text-text-secondary">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed — retrying on next edit" : saveState === "conflict" ? "Conflicting changes" : "Unsaved changes"}
          </p>
        </div>

        {actionError ? <InlineError>{actionError}</InlineError> : null}
        {saveState === "conflict" && !conflictOpen ? (
          <InlineError>This draft changed in another tab. Reload to compare before saving again.</InlineError>
        ) : null}

        {/* Proposal ready notification banner */}
        {proposal && generation?.state === "ready" && generation?.acceptanceState === "pending" ? (
          <div className="rounded-card border-2 border-honey bg-honey-wash/30 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                <Sparkles size={16} className="text-honey-deep" />
                AI Generated Introduction Ready
              </span>
              <Badge tone="honey">1 AI Credit</Badge>
            </div>
            <div className="rounded-control bg-surface p-3 border border-border-decorative text-xs text-ink space-y-1">
              <p className="font-bold text-text-secondary">SUBJECT: {proposal.subject}</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{proposal.body}</p>
            </div>
            <GroundingPanel claims={proposal.claims} />
            {proposal.profileRevision ? (
              <p className="text-xs text-text-disabled">
                Written from your confirmed profile · revision {proposal.profileRevision.revisionNo}
                {REVISION_SOURCE[proposal.profileRevision.source]
                  ? ` (${REVISION_SOURCE[proposal.profileRevision.source]})`
                  : ""}{" "}
                —{" "}
                <Link href="/app/profile" className="underline">
                  view
                </Link>
              </p>
            ) : null}
            <GroundingNotes warnings={proposal.warnings} contactId={recipient?.contactId} onFocusField={focusField} />
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={dismissProposal}>
                Dismiss
              </Button>
              <Button size="sm" variant="accent" onClick={acceptProposal} disabled={busy}>
                <Check size={14} aria-hidden /> Apply pitch to editor
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => { setSubject(e.target.value); markDirty(); }} maxLength={160} />
          <Label htmlFor="body" className="mt-3">
            Message <span className="font-normal text-text-secondary">(plain text — 75–120 words reads best)</span>
          </Label>
          <Textarea id="body" value={body} onChange={(e) => { setBody(e.target.value); markDirty(); }} rows={14} maxLength={20000} className="font-[inherit] leading-relaxed" />
          <div className="mt-2 flex items-center justify-between text-xs text-text-disabled">
            <span className={words > 180 ? "font-bold text-warning" : ""}>{words} words</span>
            <span>No Send button — ReachBee never sends email.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {gmail?.connected ? (
            <Button size="sm" variant="accent" onClick={() => setApprovalOpen(true)} disabled={busy} className="gap-1.5 shadow-sm">
              <ShieldCheck size={14} aria-hidden /> 🚀 Push to Gmail Drafts
            </Button>
          ) : recipient?.email ? (
            <Button
              size="sm"
              variant="accent"
              onClick={async () => {
                const text = `To: ${recipient.email}\nSubject: ${subject}\n\n${body}`;
                await navigator.clipboard.writeText(text);
                const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient.email!)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(url, "_blank");
              }}
              className="gap-1.5 shadow-sm"
            >
              <Mail size={14} aria-hidden /> 📋 Copy & Open Gmail Web
            </Button>
          ) : null}
          <CopyAllButton subject={subject} body={body} recipientEmail={recipient?.email ?? null} />
          <a href={`/api/v1/drafts/${draftId}/export.eml`} download>
            <Button size="sm" variant="secondary">
              <FileDown size={14} aria-hidden /> Download .eml
            </Button>
          </a>
        </div>
      </section>

      {/* Right rail: generation + delivery */}
      <aside className="order-3 space-y-4">
        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Sparkles size={15} aria-hidden className="text-honey-deep" />
            {mode === "agentic" ? "Agentic preparation" : "Quick AI"}
          </h3>
          {!profileReady ? (
            <ProfileGate
              nameValue={confirmName}
              onName={setConfirmName}
              roleValue={confirmRole || targetRole}
              onRole={(v) => {
                setConfirmRole(v);
                setTargetRole(v);
              }}
              factType={confirmFactType}
              onFactType={setConfirmFactType}
              fact={confirmFact}
              onFact={setConfirmFact}
              onSubmit={confirmProfileFact}
              busy={profileActivating}
              note={profileNote}
            />
          ) : null}
          {profileReady && pendingProfileReview ? (
            <div className="mt-2 rounded-control border border-border-decorative bg-canvas p-3 text-xs">
              <p className="font-bold text-ink">Your newest details are not being used yet</p>
              <p className="mt-1 text-text-secondary">
                {pendingProfileReview.factCount} {pendingProfileReview.factCount === 1 ? "detail" : "details"} from
                your latest upload are still waiting for review, so this draft is written from the profile you
                confirmed before that.
              </p>
              <Link href="/app/profile" className="mt-1.5 inline-block font-bold text-ink underline">
                Review and use them
              </Link>
            </div>
          ) : null}
          {generation ? (
            <div className="mt-3 space-y-2">
              <p aria-live="polite" className="text-sm font-semibold text-ink">
                {generation.state === "queued" || generation.state === "reserved" || generation.state === "preparing"
                  ? "Preparing…"
                  : generation.state === "generating"
                    ? "Writing your introduction…"
                    : generation.state === "ready"
                      ? "Draft ready for review"
                      : generation.state === "cancelled" || generation.state === "released"
                        ? "Cancelled — credit released"
                        : `Generation failed`}
              </p>
              {generation.state === "failed" ? (
                <p className="text-xs text-text-secondary">
                  {generation.failureMessage ?? "Your credit was released automatically."}
                </p>
              ) : null}
              {generation.state === "generating" || generation.state === "queued" ||
              generation.state === "reserved" || generation.state === "preparing" ? (
                <p className="text-xs text-text-secondary">
                  If this has been sitting a while, the background worker may not be running. Press Generate again to
                  restart it — your credit is only spent once a draft is actually saved.
                </p>
              ) : null}
              {generation.state === "ready" && generation.acceptanceState === "pending" ? (
                proposal ? (
                  // The editor's proposal card owns review and apply. Rendering a
                  // second copy of the draft with its own Apply/Dismiss here gave
                  // the user two identical calls to action for one decision.
                  <p className="text-xs text-text-secondary">
                    Ready for you in the editor — review it there, then apply or dismiss.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={acceptProposal} disabled={busy}>
                      <Check size={14} aria-hidden /> Apply proposal
                    </Button>
                    <Button size="sm" variant="ghost" onClick={dismissProposal}>
                      Dismiss
                    </Button>
                  </div>
                )
              ) : null}
              {generation.state === "ready" && generation.acceptanceState !== "pending" ? (
                <Button size="sm" variant="secondary" onClick={() => { setGeneration(null); }}>
                  Start another revision · 1 AI credit
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Button size="sm" variant="accent" onClick={startGeneration} disabled={busy || !canGenerate || throttled}>
                <Sparkles size={14} aria-hidden />
                {throttled
                  ? `Wait ${formatCountdown(retrySecondsLeft)} · 1 AI credit`
                  : mode === "agentic"
                    ? "Prepare and draft · 1 AI credit"
                    : "Generate introduction · 1 AI credit"}
              </Button>
              {throttled ? (
                <p className="text-xs text-text-secondary" role="status">
                  {throttleCode === "DAILY_LIMIT_REACHED"
                    ? quotaResetsAt
                      ? `Daily quota reached — it lifts at ${quotaResetsAt} your time. Your credits are safe.`
                      : "Daily quota reached at midnight UTC. Your credits are safe."
                    : "Too many requests in a row. This unlocks by itself."}
                </p>
              ) : null}
              {balances.ai.available < 1 ? (
                <p className="text-xs text-warning">
                  No AI credits left. <a href="/app/billing/plans" className="underline">Add credits</a> or keep writing manually — manual is free.
                </p>
              ) : generationInFlight ? (
                <p className="text-xs text-text-secondary">
                  A draft is already being written for this introduction. Wait for it to finish.
                </p>
              ) : !profileReady ? (
                <p className="text-xs text-text-secondary">Confirm one detail above to unlock this.</p>
              ) : !recipient ? (
                <p className="text-xs text-text-secondary">Choose a recipient first (directory or your own contact).</p>
              ) : (
                <p className="text-xs text-text-disabled">Gmail is not required. You can copy the result or export it.</p>
              )}
              <p className="text-xs text-text-disabled">
                One copilot credit buys one draft. Up to {AI_DRAFTS_PER_DAY} AI drafts a day — the count lifts at{" "}
                {quotaResetsAt ? `${quotaResetsAt} your time` : "midnight UTC"}.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Mail size={15} aria-hidden className="text-info" />
            Gmail draft
          </h3>
          {resumeOptions.length > 0 ? (
            <div className="mt-2">
              <Label htmlFor="attachment">Attach resume (optional)</Label>
              <Select id="attachment" value={attachmentId ?? ""} onChange={(e) => setAttachmentId(e.target.value || null)}>
                <option value="">No attachment</option>
                {resumeOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.scanned ? "" : " (not scan-clean)"}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          {delivery ? (
            <div className="mt-3 space-y-2">
              {delivery.state === "created" ? (
                <div className="space-y-2.5">
                  <p className="rounded-control bg-success-wash px-2.5 py-1.5 text-sm text-success" role="status">
                    Created in Gmail. Nothing has been sent — review and send it there yourself.
                  </p>
                  <div className="rounded-control border border-border-decorative bg-canvas p-2.5 text-xs space-y-2">
                    <p className="font-semibold text-ink">Next step: Keep track of this conversation</p>
                    <p className="text-text-secondary">
                      Track this outreach in your Pipeline for follow-ups, or report bounces for an instant credit replacement.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <Link href="/app/pipeline">
                        <Button size="sm" variant="secondary" className="gap-1 text-xs">
                          <KanbanSquare size={13} aria-hidden /> Track in Pipeline
                        </Button>
                      </Link>
                      {recipient?.contactId ? (
                        <Link href={`/app/contacts/${recipient.contactId}`}>
                          <Button size="sm" variant="ghost" className="text-xs">
                            Contact details
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : delivery.state === "unknown" || delivery.state === "reconciling" ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 rounded-control bg-warning-wash px-2.5 py-1.5 text-sm text-warning" role="status">
                    <RefreshCw size={14} aria-hidden className="animate-spin" style={{ animationDuration: "2s" }} />
                    Checking whether Gmail created the draft…
                  </p>
                  <Button size="sm" variant="secondary" onClick={reconcile}>Check again</Button>
                </div>
              ) : delivery.state === "needs_confirmation" ? (
                <div className="space-y-2">
                  <p className="flex items-start gap-2 rounded-control bg-warning-wash px-2.5 py-1.5 text-xs text-warning" role="alert">
                    <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
                    Gmail may have created the draft, but we didn’t receive confirmation. Check your Drafts folder before
                    creating another.
                  </p>
                  <Button size="sm" variant="danger" onClick={recreate} disabled={busy}>
                    Create a new draft anyway (may duplicate)
                  </Button>
                </div>
              ) : delivery.state === "known_failed" || delivery.state === "blocked" ? (
                <div className="space-y-2">
                  <p className="rounded-control bg-danger-wash px-2.5 py-1.5 text-xs text-danger" role="alert">
                    {delivery.failureMessage ?? "Gmail delivery failed."}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setApprovalOpen(true)}>
                      Try again
                    </Button>
                    <CopyAllButton subject={subject} body={body} recipientEmail={recipient?.email ?? null} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary" role="status">Creating draft in Gmail…</p>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Button size="sm" variant="primary" onClick={() => setApprovalOpen(true)} disabled={busy}>
                <ShieldCheck size={14} aria-hidden /> Review and create Gmail draft
              </Button>
              {!gmail?.connected ? (
                <p className="text-xs text-text-secondary">
                  {gmail?.mode === "mock"
                    ? "Sandbox mode: deliveries are simulated and clearly labeled."
                    : "Gmail isn’t connected. Copy/export always works."}
                </p>
              ) : (
                <p className="text-xs text-text-disabled">Connected as {gmail.email}. Nothing is sent without your approval here.</p>
              )}
            </div>
          )}
        </div>

        {/* Candidate Outreach Guardian & Deliverability Checklist */}
        <div className="rounded-card border border-border-decorative bg-surface p-4 space-y-2.5">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink">
            <ShieldCheck size={14} className="text-accent" /> Candidate Outreach Guardian
          </h4>
          <ul className="space-y-2 text-xs text-text-secondary">
            <li className="flex items-start gap-1.5">
              <span className="text-success font-bold">✓</span>
              <span><strong>Pacing Limit:</strong> Maximum 10–15 messages per 24 hours to keep your domain reputation safe.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-success font-bold">✓</span>
              <span><strong>Optimal Timing:</strong> Send during local working hours (10:00 AM – 4:00 PM) for maximum replies.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-success font-bold">✓</span>
              <span><strong>Bounce Guarantee:</strong> If an address bounces, report it for an instant replacement credit.</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Approval dialog (§13.5) */}
      <Dialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        title="Review and approve"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setApprovalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={approveAndDeliver} disabled={busy}>
              {busy ? "Working…" : "Approve and create draft"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="rounded-control bg-success-wash px-3 py-2 font-semibold text-success">
            Nothing will be sent. This creates a draft in your Gmail — sending stays with you.
          </p>
          <dl className="space-y-1.5">
            <Row label="Recipient" value={recipient?.email ?? (recipient?.kind === "directory" ? "Locked email — reveal first" : "—")} />
            <Row label="Mailbox" value={gmail?.email ?? "Not connected"} />
            <Row label="Subject" value={subject || "(empty)"} />
            <Row label="Attachment" value={resumeOptions.find((r) => r.id === attachmentId)?.name ?? "None"} />
          </dl>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-disabled">Message preview</p>
            <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border-decorative bg-canvas p-3 text-sm text-ink">
              {body || "(empty)"}
            </pre>
          </div>
        </div>
      </Dialog>

      {/* Version conflict dialog (§13.6) */}
      <Dialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Conflicting changes"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setConflictOpen(false); window.location.reload(); }}>
              Reload latest
            </Button>
            <Button size="sm" onClick={() => { setConflictOpen(false); navigator.clipboard.writeText(`${subject}\n\n${body}`); }}>
              Copy my text
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          This draft was saved from another tab or window. Nothing was overwritten. Copy your text or reload to compare
          the latest version.
        </p>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

function CopyAllButton({ subject, body, recipientEmail }: { subject: string; body: string; recipientEmail: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        const text = recipientEmail ? `To: ${recipientEmail}\nSubject: ${subject}\n\n${body}` : `Subject: ${subject}\n\n${body}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <Copy size={14} aria-hidden /> {copied ? "Copied" : "Copy draft"}
      <Download aria-hidden className="hidden" />
    </Button>
  );
}
