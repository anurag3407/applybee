import Link from "next/link";

/** Correct 403 surface without leaking resource existence (§11.8). */
export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-text-secondary">403</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">You don’t have access to this area</h1>
      <p className="mt-2 max-w-md text-text-secondary">
        If you believe you should have access, contact support — hidden navigation is not a security boundary, so this
        check is enforced on the server.
      </p>
      <Link href="/app" className="mt-6 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:bg-ink-soft">
        Back to workspace
      </Link>
    </div>
  );
}
