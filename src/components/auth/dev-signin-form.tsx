"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, InlineError } from "@/components/ui/primitives";
import { safeEmail } from "@/lib/validation";

/**
 * Development session adapter sign-in (labeled). When Clerk is configured in
 * production, this form is replaced by the Clerk component — see the notice.
 */
export function DevSignInForm({ mode, redirectTo }: { mode: "sign-in" | "sign-up"; redirectTo?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? "").trim(),
      name: String(form.get("name") ?? "").trim() || undefined,
    };
    if (!safeEmail.safeParse(payload.email).success) {
      setError("Enter a valid email address.");
      setState("error");
      return;
    }
    try {
      const res = await fetch("/api/v1/auth/dev-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Sign-in failed.");
      }
      const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/app";
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <InlineError>{error}</InlineError> : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      {mode === "sign-up" ? (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" maxLength={120} placeholder="Your name" />
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={state === "submitting"}>
        {state === "submitting" ? "Signing in…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
