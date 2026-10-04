"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Structured client-side reporting hooks in via Sentry when configured;
    // message content of drafts is never included.
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-text-secondary">Something went wrong</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">This part of the app hit a snag</h1>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        Your saved work is safe — drafts and credits are stored server-side. Try again, and if it keeps happening,
        contact support with the reference below.
      </p>
      {error.digest ? (
        <p className="tabular mt-2 rounded-control bg-surface-subtle px-3 py-1.5 text-xs text-text-secondary">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:bg-ink-soft">
          Try again
        </button>
        <Link href="/contact" className="rounded-control border border-border-control px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
          Contact support
        </Link>
      </div>
    </div>
  );
}
