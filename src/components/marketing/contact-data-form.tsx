"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label, Textarea, InlineError } from "@/components/ui/primitives";
import { safeEmail } from "@/lib/validation";

/** Contact-data correction/removal request — no account required (§11.2). */
export function ContactDataForm() {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      requestType: String(form.get("requestType") ?? "removal"),
      details: String(form.get("details") ?? ""),
    };
    if (!safeEmail.safeParse(payload.email).success || payload.details.length < 10) {
      setError("Enter a valid email and describe the request (at least 10 characters).");
      setState("error");
      return;
    }
    try {
      const res = await fetch("/api/v1/public?kind=contact-data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("FAILED");
      setState("done");
    } catch {
      setError("Something went wrong. Please try again in a moment.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-card border border-success/30 bg-success-wash p-6" role="status">
        <h2 className="text-lg font-bold text-success">Request received</h2>
        <p className="mt-2 text-sm text-ink">
          We’ll review and act on your request, and reply to the email you provided. No account was needed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <InlineError>{error}</InlineError> : null}
      <div>
        <Label htmlFor="cd-email">Your email (the one listed in the directory)</Label>
        <Input id="cd-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="requestType">Request type</Label>
        <select
          id="requestType"
          name="requestType"
          className="h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink"
          defaultValue="removal"
        >
          <option value="removal">Remove my record</option>
          <option value="correction">Correct my record</option>
        </select>
      </div>
      <div>
        <Label htmlFor="details">Details</Label>
        <Textarea id="details" name="details" rows={5} maxLength={2000} required />
        <p className="mt-1 text-xs text-text-disabled">
          For corrections, tell us what changed. We never publish your message.
        </p>
      </div>
      <Button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending…" : "Submit request"}
      </Button>
    </form>
  );
}
