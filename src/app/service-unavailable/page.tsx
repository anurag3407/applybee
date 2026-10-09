import Link from "next/link";
import { IllustLoading } from "@/components/svg/illustrations";
import { IconRefresh } from "@/components/svg/icons";

/** Planned maintenance / dependency disruption (§11.8). */
export default function ServiceUnavailablePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-5 text-center">
      <IllustLoading className="text-text-secondary" />
      <div className="space-y-2">
        <p className="text-sm font-bold text-warning">503, temporarily unavailable</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Temporarily unavailable</h1>
        <p className="mx-auto max-w-md text-text-secondary">
          A dependency is briefly down or we’re doing planned maintenance. Saved drafts, credits, and payments are
          durable, nothing is lost by waiting.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="ab-press inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft"
        >
          <IconRefresh size={15} />
          Try the home page
        </Link>
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
