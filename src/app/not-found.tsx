import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 text-center">
      <Wordmark />
      <p className="mt-8 text-sm font-bold uppercase tracking-wider text-text-secondary">404</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">We couldn’t find that page</h1>
      <p className="mt-2 max-w-md text-text-secondary">
        The link may be old or mistyped. Everything else is where you left it.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:bg-ink-soft">
          Home
        </Link>
        <Link href="/app" className="rounded-control border border-border-control px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
          Workspace
        </Link>
      </div>
    </div>
  );
}
