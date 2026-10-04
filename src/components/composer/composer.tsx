"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Sparkles, ShieldCheck, AlertTriangle, RefreshCw, Mail, FileDown } from "lucide-react";
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
  resumeOptions: Array<{ id: string; name: string; scanned: boolean }>;
  initialGeneration?: {
    id: string;
    state: string;
    acceptanceState?: string;
    proposedRevisionId?: string | null;
    failureCode?: string | null;
    failureMessage?: string | null;
    proposal?: { subject: string; body: string } | null;
  } | null;
  initialDelivery?: DeliveryState;
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

const INTENTS = [
  { value: "advertised_role", label: "Advertised role" },
  { value: "internship", label: "Internship" },
  { value: "intro", label: "Speculative intro" },
  { value: "referral", label: "Referral request" },
  { value: "follow_up", label: "Follow-up" },
];

export function Composer({ draftId, initial, recipient, balances, gmail, hasApprovedProfile, resumeOptions, initialGeneration, initialDelivery }: ComposerProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [version, setVersion] = useState(initial.version);
  const [mode, setMode] = useState(initial.mode);
  const [intent, setIntent] = useState(initial.intent);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationState>(initialGeneration ?? null);
  const [proposal, setProposal] = useState<{ subject: string; body: string; factIds: number; warnings: string[] } | null>(
    initialGeneration?.proposal ? { ...initialGeneration.proposal, factIds: 0, warnings: [] } : null,
  );
  const [delivery, setDelivery] = useState<DeliveryState>(initialDelivery ?? null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pollSource, setPollSource] = useState<AbortController | null>(null);

  const savedVersion = useRef(version);
  const dirtyRef = useRef(false);

  /* Autosave: debounce 800ms; flush on approval; version-checked. */
  const save = useCallback(
    async (payload: { subject: string; body: string; expectedVersion: number; intent?: string; mode?: string }) => {
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
          return false;
        }
        if (!res.ok) throw new Error("SAVE_FAILED");
        const data = (await res.json()) as { data: { version: number } };
        savedVersion.current = data.data.version;
        setVersion(data.data.version);
        setSaveState("saved");
        return true;
      } catch {
        setSaveState("error");
        return false;
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

  /* Polling: 2s → 5s → 10s, stop when done or hidden (§20.5). */
  const pollGeneration = useCallback(
    async (generationId: string) => {
      let delay = 2000;
      const controller = new AbortController();
      setPollSource(controller);
      while (!controller.signal.aborted) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2.5, 10_000);
        if (document.hidden) continue;
        try {
          const res = await fetch(`/api/v1/generations/${generationId}`, { signal: controller.signal });
          if (!res.ok) break;
          const data = (await res.json()) as {
            data: GenerationState & { id: string; proposal?: { subject: string; body: string } | null; usage?: { factsUsed?: number } | null };
          };
          setGeneration(data.data);
          if (data.data.state === "ready" && data.data.proposal) {
            setProposal({
              subject: data.data.proposal.subject,
              body: data.data.proposal.body,
              factIds: data.data.usage?.factsUsed ?? 0,
              warnings: [],
            });
          }
          if (["ready", "failed", "released", "cancelled"].includes(data.data.state)) break;
        } catch {
          break;
        }
      }
    },
    [],
  );

  async function startGeneration() {
    setActionError(null);
    // Flush pending edits first so the snapshot includes them.
    const flushed = await save({ subject, body, expectedVersion: savedVersion.current, intent, mode });
    if (!flushed && saveState === "conflict") return;
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
      const data = (await res.json()) as {
        data?: { generationId: string };
        error?: { code?: string; message?: string };
      };
      if (!res.ok || !data.data) {
        throw new Error(data.error?.message ?? "Generation could not start.");
      }
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
      const ok = await save({ subject, body, expectedVersion: savedVersion.current, intent, mode });
      if (!ok) throw new Error("Save your draft first — it changed and needs a clean save.");
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
  const canGenerate = balances.ai.available > 0 && recipient !== null;

  return (
    <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
      {/* Left context rail */}
      <aside className="order-2 space-y-4 xl:order-1">
        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-text-disabled">Recipient</h3>
          {recipient ? (
            <div className="mt-2 text-sm">
              <p className="font-bold text-ink">{recipient.name ?? recipient.email}</p>
              {recipient.title ? <p className="text-text-secondary">{recipient.title}</p> : null}
              {recipient.companyName ? <p className="text-text-secondary">{recipient.companyName}</p> : null}
              {recipient.kind === "directory" && !recipient.unlocked ? (
                <Badge tone="warning">Email locked — reveal in directory before Gmail delivery</Badge>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-secondary">No recipient yet.</p>
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

        <div className="rounded-card border border-border-decorative bg-surface p-4">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => { setSubject(e.target.value); markDirty(); }} maxLength={160} />
          <Label htmlFor="body" className="mt-3">
            Message <span className="font-normal text-text-secondary">(plain text — 75–120 words reads best)</span>
          </Label>
          <Textarea id="body" value={body} onChange={(e) => { setBody(e.target.value); markDirty(); }} rows={14} maxLength={20000} className="font-[inherit] leading-relaxed" />
          <div className="mt-2 flex items-center justify-between text-xs text-text-disabled">
            <span className={words > 180 ? "font-bold text-warning" : ""}>{words} words</span>
            <span>No Send button — Apply Bee never sends email.</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
          {!hasApprovedProfile ? (
            <p className="mt-2 rounded-control bg-warning-wash px-2.5 py-1.5 text-xs text-warning">
              Confirm a few profile facts first — AI writes only from confirmed details.{" "}
              <a href="/app/profile" className="underline">Career profile</a>
            </p>
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
              {generation.state === "ready" && generation.acceptanceState === "pending" ? (
                <div className="space-y-2">
                  {proposal ? (
                    <div className="rounded-control border border-border-decorative bg-canvas p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-text-disabled">Proposed draft</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{proposal.subject}</p>
                      <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">
                        {proposal.body}
                      </pre>
                    </div>
                  ) : null}
                  <p className="rounded-control bg-info-wash px-2.5 py-1.5 text-xs text-info">
                    Applying the proposal is a separate, version-checked action. Your manual edits stay intact.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={acceptProposal} disabled={busy}>
                      <Check size={14} aria-hidden /> Apply proposal
                    </Button>
                    <Button size="sm" variant="ghost" onClick={dismissProposal}>
                      Dismiss
                    </Button>
                  </div>
                  <p className="text-xs text-text-disabled">Applying costs nothing extra — the credit settled when the draft was validated.</p>
                </div>
              ) : null}
              {generation.state === "ready" && generation.acceptanceState !== "pending" ? (
                <Button size="sm" variant="secondary" onClick={() => { setGeneration(null); }}>
                  Start another revision · 1 AI credit
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Button size="sm" variant="accent" onClick={startGeneration} disabled={busy || !canGenerate || !hasApprovedProfile}>
                <Sparkles size={14} aria-hidden />
                {mode === "agentic" ? "Prepare and draft · 1 AI credit" : "Generate introduction · 1 AI credit"}
              </Button>
              {balances.ai.available < 1 ? (
                <p className="text-xs text-warning">
                  No AI credits left. <a href="/app/billing/plans" className="underline">Add credits</a> or keep writing manually — manual is free.
                </p>
              ) : !recipient ? (
                <p className="text-xs text-text-secondary">Choose a recipient first (directory or your own contact).</p>
              ) : (
                <p className="text-xs text-text-disabled">Gmail is not required. You can copy the result or export it.</p>
              )}
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
                <p className="rounded-control bg-success-wash px-2.5 py-1.5 text-sm text-success" role="status">
                  Created in Gmail. Nothing has been sent — review and send it there yourself.
                </p>
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
