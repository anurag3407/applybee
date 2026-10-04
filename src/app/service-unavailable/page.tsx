import Link from "next/link";

/** Planned maintenance / dependency disruption (§11.8). */
export default function ServiceUnavailablePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-text-secondary">503</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">Temporarily unavailable</h1>
      <p className="mt-2 max-w-md text-text-secondary">
        A dependency is briefly down or we’re doing planned maintenance. Saved drafts, credits, and payments are
        durable — nothing is lost by waiting.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:bg-ink-soft">
          Try the home page
        </Link>
        <Link href="/contact" className="rounded-control border border-border-control px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
          Contact support
        </Link>
      </div>
    </div>
  );
}
