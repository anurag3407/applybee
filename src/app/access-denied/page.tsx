import Link from "next/link";
import { IllustError } from "@/components/svg/illustrations";
import { IconArrowLeft } from "@/components/svg/icons";

/** Correct 403 surface without leaking resource existence (§11.8). */
export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-5 text-center">
      <IllustError className="text-text-secondary" />
      <div className="space-y-2">
        <p className="text-sm font-bold text-danger">403, access denied</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">You don’t have access to this area</h1>
        <p className="mx-auto max-w-md text-text-secondary">
          If you believe you should have access, contact support, hidden navigation is not a security boundary, so
          this check is enforced on the server.
        </p>
      </div>
      <Link
        href="/app"
        className="ab-press inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft"
      >
        <IconArrowLeft size={15} />
        Back to workspace
      </Link>
    </div>
  );
}
