"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IllustError } from "@/components/svg/illustrations";
import { IconRefresh } from "@/components/svg/icons";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Structured client-side reporting hooks in via Sentry when configured;
    // message content of drafts is never included.
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-5 text-center">
      <IllustError className="text-text-secondary" />
      <div className="space-y-2">
        <p className="text-sm font-bold text-danger">Something went wrong</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">This part of the app hit a snag</h1>
        <p className="mx-auto max-w-md text-sm text-text-secondary">
          Your saved work is safe, drafts and credits are stored server-side. Try again, and if it keeps happening,
          contact support with the reference below.
        </p>
        {error.digest ? (
          <p className="tabular mt-2 inline-block rounded-control bg-surface-subtle px-3 py-1.5 text-xs text-text-secondary">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="ab-press inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft"
        >
          <IconRefresh size={15} />
          Try again
        </button>
        <Link
          href="/contact"
          className="ab-press inline-flex min-h-11 items-center rounded-control border border-border-control bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-subtle"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
