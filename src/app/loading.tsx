import { IllustLoading } from "@/components/svg/illustrations";

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas text-center"
    >
      <IllustLoading className="text-text-secondary" />
      <p className="text-sm font-bold text-ink">Loading ReachBee</p>
      <p className="max-w-xs text-xs text-text-secondary">Setting up your outreach workspace.</p>
    </div>
  );
}
