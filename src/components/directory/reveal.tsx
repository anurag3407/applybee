"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconBee, IconCompose, IconCopy, IconFlag, IconLock, IconPocket, IconPocketFilled, IconSend
} from "@/components/svg/icons";
import { Dialog } from "@/components/ui/dialog";
import { Button, Badge, InlineError } from "@/components/ui/primitives";

/**
 * RevealAction (§12.3): shows "Reveal email · 1 contact credit", performs an
 * idempotent atomic reveal, and displays the authoritative server balance —
 * never a locally computed one.
 */
export function RevealAction({
  contactId,
  unlocked,
  initialEmail,
  initialBalance,
  maskedEmail,
  contactName,
}: {
  contactId: string;
  unlocked: boolean;
  initialEmail: string | null;
  initialBalance: { available: number; reserved: number } | null;
  /** Server-computed masked preview (domain only). Never fabricated client-side. */
  maskedEmail: string;
  contactName: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [balance, setBalance] = useState(initialBalance);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function reveal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/contacts/${contactId}/reveal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ contactId }),
      });
      const body = (await res.json()) as {
        data?: { email: string; alreadyUnlocked: boolean; charged: boolean; balances: { contact: { available: number; reserved: number } } };
        error?: { code?: string; message?: string };
      };
      if (!res.ok || !body.data) {
        throw new Error(body.error?.message ?? "Reveal failed.");
      }
      setEmail(body.data.email);
      setBalance(body.data.balances.contact);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reveal failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!email) return;
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (email) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-control border border-border-decorative bg-canvas px-3 py-1.5 text-sm font-semibold text-ink">
            {email}
          </code>
          <Button size="sm" variant="secondary" onClick={copy} aria-label="Copy email address">
            <IconCopy size={14} aria-hidden /> {copied ? "Copied" : "Copy"}
          </Button>
          <WriteToContactButton contactId={contactId} />
        </div>
        {balance ? (
          <p className="text-xs text-text-disabled">
            {balance.available} contact {balance.available === 1 ? "reveal" : "reveals"} left
          </p>
        ) : null}
        {error ? <InlineError>{error}</InlineError> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <code className="inline-flex items-center gap-1.5 rounded-control border border-border-decorative bg-canvas px-2 py-1 text-xs font-semibold text-text-secondary">
        <IconLock size={12} aria-hidden /> {maskedEmail}
      </code>
      <div>
        <Button size="sm" variant="secondary" onClick={reveal} disabled={busy} icon={<IconSend size={14} />}>
          {busy ? "Revealing…" : "Reveal · 1 credit"}
        </Button>
      </div>
      {balance && balance.available < 1 ? (
        <p className="text-xs text-warning">
          No contact reveals left. <a href="/app/billing/plans" className="underline">Add credits</a>.
        </p>
      ) : null}
      {error ? <InlineError>{error}</InlineError> : null}
    </div>
  );
}

export function SaveContactButton({ contactId, saved }: { contactId: string; saved: boolean }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      if (isSaved) {
        await fetch(`/api/v1/saved-contacts/${contactId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/v1/saved-contacts/${contactId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" });
      }
      setIsSaved(!isSaved);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="quiet" onClick={toggle} disabled={busy} aria-pressed={isSaved}>
      {isSaved ? <IconPocketFilled size={14} aria-hidden /> : <IconPocket size={14} aria-hidden />}
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}

export function WriteToContactButton({ contactId }: { contactId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "quick_ai", intent: "intro", recipient: { kind: "directory", contactId } }),
      });
      const body = (await res.json()) as { data?: { draftId: string }; error?: { message?: string } };
      if (!res.ok || !body.data) throw new Error(body.error?.message ?? "Could not create a draft.");
      window.location.href = `/app/drafts/${body.data.draftId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a draft.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="accent" onClick={start} disabled={busy} className="gap-1.5 shadow-sm">
        <IconBee size={14} /> {busy ? "Opening…" : "Reach Out"}
      </Button>
      {error ? <InlineError>{error}</InlineError> : null}
    </div>
  );
}

export function OneClickOutreachButton({
  contactId,
  contactName,
  availableCredits,
}: {
  contactId: string;
  contactName: string;
  availableCredits: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOneClick() {
    if (availableCredits < 1) {
      setError("No contact credits left. Add credits to reach out.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // 1. Reveal email
      const revealRes = await fetch(`/api/v1/contacts/${contactId}/reveal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ contactId }),
      });
      const revealBody = (await revealRes.json()) as { error?: { message?: string } };
      if (!revealRes.ok) throw new Error(revealBody.error?.message ?? "Could not reveal contact.");

      // 2. Create draft in AI mode
      const draftRes = await fetch("/api/v1/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "quick_ai",
          intent: "intro",
          recipient: { kind: "directory", contactId },
        }),
      });
      const draftBody = (await draftRes.json()) as { data?: { draftId: string }; error?: { message?: string } };
      if (!draftRes.ok || !draftBody.data?.draftId) {
        throw new Error(draftBody.error?.message ?? "Could not open outreach composer.");
      }

      window.location.href = `/app/drafts/${draftBody.data.draftId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Outreach failed to start.");
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="accent"
        onClick={handleOneClick}
        disabled={busy}
        className="gap-1.5 whitespace-nowrap shadow-sm"
        title={`Reveal ${contactName.split(" ")[0]}'s email & start tailored outreach`}
      >
        <IconBee size={14} aria-hidden />
        {busy ? "Starting…" : "1-Click Outreach"}
      </Button>
      {error ? (
        <div className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-surface p-1 shadow-md border border-danger/40">
          <InlineError>{error}</InlineError>
        </div>
      ) : null}
    </div>
  );
}

export function ReportContactDialog({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("bounced");
  const [details, setDetails] = useState("");

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/contacts/${contactId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: type, details: details || "Reported contact" }),
      });
      const body = await res.json();
      setDone(true);
      setMessage(body?.data?.message || "Thanks. Our team will review this report.");
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1800);
    } catch (_) {
      setMessage("Failed to submit report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <IconFlag size={14} aria-hidden /> Report / Bounce Refund
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Report contact & request replacement">
        {done ? (
          <p role="status" className="text-sm font-medium text-success">{message}</p>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-ink" htmlFor="report-type">Reason</label>
            <select id="report-type" value={type} onChange={(e) => setType(e.target.value)} className="h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink">
              <option value="bounced">Email Bounced / Unreachable (request a replacement credit)</option>
              <option value="stale">Left the company / role changed</option>
              <option value="incorrect">Details are incorrect</option>
              <option value="removal">I am this person, remove me</option>
              <option value="abuse">Something else</option>
            </select>
            <label className="block text-sm font-semibold text-ink" htmlFor="report-details">
              {type === "bounced" ? "Bounce Details (Optional)" : "Details"}
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full rounded-control border border-border-control bg-surface px-3 py-2 text-ink"
              placeholder={type === "bounced" ? "e.g. Mail delivery failed with 550 User not found" : "Tell us what you noticed."}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" variant={type === "bounced" ? "accent" : "primary"} onClick={submit} disabled={busy}>
                {busy ? "Processing…" : type === "bounced" ? "Request replacement credit" : "Send report"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
