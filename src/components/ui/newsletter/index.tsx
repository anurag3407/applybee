'use client';

import React, { useState } from 'react';
import { Button } from '@/components/base-ui/button';
import { Input } from '@/components/base-ui/input';

export interface Newsletter1Props {
  heading: string;
  subheading?: string;
  placeholder?: string;
  buttonText?: string;
  disclaimer?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function Newsletter1({
  heading,
  subheading,
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  disclaimer,
  onSubmit,
}: Newsletter1Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDefaultSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (onSubmit) {
      onSubmit(e);
      return;
    }
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/public?kind=newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Could not subscribe. Please try again.");
      }
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="bg-surface border border-border-decorative text-foreground shadow-lg dark:bg-[#0c0d12] dark:border-white/[0.09] dark:text-white dark:shadow-[0_30px_90px_rgba(0,0,0,0.95)] relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:rounded-[2.5rem] md:px-12 md:py-24 lg:py-28 transition-colors">
      {/* Ambient background auras */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -left-12 h-80 w-80 rounded-full bg-orange-500/15 dark:bg-orange-600/30 blur-[90px] transition-opacity"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-80 w-80 rounded-full bg-blue-500/15 dark:bg-blue-600/35 blur-[90px] transition-opacity"
      />
      <div className="pointer-events-none absolute top-0 left-0 opacity-15 dark:opacity-20 text-border-decorative dark:text-white">
        <div className="border-current absolute top-0 left-0 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] sm:h-[400px] sm:w-[400px]" />
        <div className="border-current absolute top-0 left-0 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] sm:h-[480px] sm:w-[480px]" />
        <div className="border-current absolute top-0 left-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] sm:h-[560px] sm:w-[560px]" />
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 opacity-15 dark:opacity-20 text-border-decorative dark:text-white">
        <div className="border-current absolute right-0 bottom-0 h-[300px] w-[300px] translate-x-1/2 translate-y-1/2 rounded-full border-[1.5px] sm:h-[400px] sm:w-[400px]" />
        <div className="border-current absolute right-0 bottom-0 h-[350px] w-[350px] translate-x-1/2 translate-y-1/2 rounded-full border-[1.5px] sm:h-[480px] sm:w-[480px]" />
        <div className="border-current absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full border-[1.5px] sm:h-[560px] sm:w-[560px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
        <h2 className="mb-4 max-w-xl text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight text-foreground dark:text-white">
          {heading}
        </h2>

        {subheading && (
          <p className="mb-8 max-w-xl text-lg text-balance text-muted-foreground dark:text-zinc-300 sm:text-xl">
            {subheading}
          </p>
        )}

        {subscribed ? (
          <div className="mx-auto mt-8 mb-6 max-w-xl rounded-full bg-success-wash border border-success/30 px-6 py-4 text-center font-medium text-success shadow-md">
            ✓ Thank you for subscribing! We&apos;ll deliver actionable outreach guides and updates.
          </div>
        ) : (
          <form
            onSubmit={handleDefaultSubmit}
            className="bg-canvas border border-border-control/30 dark:border-white/10 dark:bg-[#121318] mx-auto mt-8 mb-6 flex w-full flex-col items-center gap-3 shadow-md sm:mt-10 sm:max-w-xl sm:flex-row sm:gap-0 sm:rounded-full sm:p-2 transition-colors"
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              disabled={submitting}
              className="text-foreground bg-transparent placeholder:text-muted-foreground h-14 w-full rounded-full border-none px-6 text-base shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 sm:flex-1 sm:rounded-none sm:rounded-l-full sm:bg-transparent"
              required
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-14 w-full shrink-0 rounded-full px-8 text-base font-semibold shadow-sm transition-transform hover:scale-[1.02] sm:w-auto cursor-pointer bg-primary text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Subscribing…" : buttonText}
            </Button>
          </form>
        )}
        {error ? <p className="mb-4 text-xs font-medium text-danger">{error}</p> : null}

        {disclaimer && (
          <p className="mx-auto mt-2 max-w-md text-center text-xs font-medium text-balance text-muted-foreground dark:text-zinc-400 sm:text-sm">
            {disclaimer}
          </p>
        )}
      </div>
    </div>
  );
}

export { Newsletter1 };
