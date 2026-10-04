"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label, Select, Textarea, InlineError } from "@/components/ui/primitives";
import { safeEmail } from "@/lib/validation";

/** Support form (§11.2): validation, submitted, failed, retry states. */
export function ContactForm() {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      category: String(form.get("category") ?? "other"),
      message: String(form.get("message") ?? ""),
      reference: String(form.get("reference") ?? "") || undefined,
    };
    if (!safeEmail.safeParse(payload.email).success) {
      setError("Enter a valid email address.");
      setState("error");
      return;
    }
    if (payload.message.length < 20) {
      setError("Tell us a bit more (at least 20 characters).");
      setState("error");
      return;
    }
    try {
      const res = await fetch("/api/v1/public?kind=support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("FAILED");
      const body = (await res.json()) as { data?: { reference?: string } };
      setReference(body.data?.reference ?? null);
      setState("done");
    } catch {
      setError("We couldn’t send your message. Please try again in a moment.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-card border border-success/30 bg-success-wash p-6" role="status">
        <h2 className="text-lg font-bold text-success">Message received</h2>
        <p className="mt-2 text-sm text-ink">
          {reference ? (
            <>Your reference is <strong className="tabular">{reference}</strong>. Keep it for faster follow-up.</>
          ) : (
            "We’ll reply by email."
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <InlineError>{error}</InlineError> : null}
      <div>
        <Label htmlFor="email">Your email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-describedby="email-error" />
      </div>
      <div>
        <Label htmlFor="category">What is this about?</Label>
        <Select id="category" name="category" defaultValue="account">
          <option value="account">Account</option>
          <option value="credits">Credits and billing</option>
          <option value="gmail">Gmail connection</option>
          <option value="resume">Resume and profile</option>
          <option value="contact_data">My data in the directory</option>
          <option value="bug">Something broke</option>
          <option value="security">Security report</option>
          <option value="other">Something else</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="reference">Payment or support reference (optional)</Label>
        <Input id="reference" name="reference" maxLength={100} placeholder="e.g. SUP-… or order reference" />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={6} maxLength={5000} required />
        <p className="mt-1 text-xs text-text-disabled">Don’t include passwords or draft content.</p>
      </div>
      <Button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
