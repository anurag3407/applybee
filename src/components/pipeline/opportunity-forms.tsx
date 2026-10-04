"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, InlineError } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";

/** New-opportunity dialog (§12.5). User-entered; no inference from drafts. */
export function NewOpportunityButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const nextActionAt = String(form.get("nextActionAt") ?? "");
    const payload: Record<string, unknown> = {
      companyName: String(form.get("companyName") ?? ""),
      roleTitle: String(form.get("roleTitle") ?? ""),
      jobUrl: String(form.get("jobUrl") ?? ""),
      source: String(form.get("source") ?? "") || undefined,
    };
    if (nextActionAt) {
      payload.nextActionAt = new Date(nextActionAt).toISOString();
      payload.nextActionNote = "Next action set at creation";
    }
    try {
      const res = await fetch("/api/v1/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Could not create opportunity.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create opportunity.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add opportunity
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Track an opportunity">
        <form onSubmit={onSubmit} className="space-y-3" id="new-opportunity-form">
          {error ? <InlineError>{error}</InlineError> : null}
          <div>
            <Label htmlFor="op-company">Company</Label>
            <Input id="op-company" name="companyName" required maxLength={160} />
          </div>
          <div>
            <Label htmlFor="op-role">Role</Label>
            <Input id="op-role" name="roleTitle" required maxLength={160} />
          </div>
          <div>
            <Label htmlFor="op-url">Job posting URL (optional, stored as reference)</Label>
            <Input id="op-url" name="jobUrl" type="url" placeholder="https://" />
          </div>
          <div>
            <Label htmlFor="op-when">Next action (optional)</Label>
            <Input id="op-when" name="nextActionAt" type="datetime-local" />
          </div>
          <div>
            <Label htmlFor="op-source">Where you found it (optional)</Label>
            <Input id="op-source" name="source" maxLength={300} />
          </div>
        </form>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" form="new-opportunity-form" disabled={busy}>
            {busy ? "Adding…" : "Add opportunity"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
