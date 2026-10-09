import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { IllustLost } from "@/components/svg/illustrations";
import { IconArrowLeft } from "@/components/svg/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-5 text-center">
      <Wordmark />
      <IllustLost className="mt-2" />
      <div className="space-y-2">
        <p className="text-sm font-bold text-text-secondary">404, page not found</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">We couldn’t find that page</h1>
        <p className="mx-auto max-w-md text-text-secondary">
          The link may be old or mistyped. Everything else is where you left it.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="ab-press inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft"
        >
          <IconArrowLeft size={15} />
          Home
        </Link>
        <Link
          href="/app"
          className="ab-press inline-flex min-h-11 items-center rounded-control border border-border-control bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-subtle"
        >
          Workspace
        </Link>
      </div>
    </div>
  );
}
