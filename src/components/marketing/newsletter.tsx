"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FieldError, Input } from "@/components/ui/primitives";

/**
 * Weekly outreach note. One band, one action, and real loading, success and
 * error states because the form writes to a live endpoint.
 */
export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/v1/public?kind=newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setState("done");
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "Could not subscribe. Please try again.");
      setState("idle");
    } catch {
      setError("Network error. Please try again later.");
      setState("idle");
    }
  }

  return (
    <section className="border-y border-border-decorative bg-surface">
      <div className="mx-auto grid max-w-[calc(var(--ab-container-marketing))] items-center gap-8 px-5 py-14 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] md:py-16 lg:px-8">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-text-disabled">The outreach note</p>
          <h2 className="mt-3 max-w-[24ch] text-[1.625rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            One useful note a week. No growth-hack theatre.
          </h2>
          <p className="mt-3 max-w-[52ch] text-[0.875rem] leading-relaxed text-text-secondary">
            How engineering managers actually read a cold introduction, and what the drafts that got replies had in
            common. Unsubscribe from any issue.
          </p>
        </div>

        <div>
          {state === "done" ? (
            <p
              role="status"
              className="rounded-control border border-success/30 bg-success-wash px-4 py-3.5 text-[0.875rem] font-semibold text-success"
            >
              Subscribed. The next note goes out this week.
            </p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={state === "sending"}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-h-11 flex-1"
              />
              <Button type="submit" variant="primary" disabled={state === "sending"} className="min-h-11 shrink-0 px-5">
                {state === "sending" ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
          )}
          {error ? <FieldError id="newsletter-error">{error}</FieldError> : null}
          <p className="mt-3 text-[0.6875rem] text-text-disabled">
            We store the address and nothing else. See the{" "}
            <Link href="/legal/privacy" className="font-semibold text-ink underline decoration-border-control underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
