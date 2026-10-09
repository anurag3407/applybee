import { IllustLoading } from "@/components/svg/illustrations";

/**
 * Route-level loading. A named pause rather than a fake version of the page:
 * a skeleton that mimics a layout the real data never fills reads as noise.
 */
export default function AppLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
    >
      <IllustLoading className="text-text-secondary" />
      <p className="text-sm font-bold text-ink">Loading your workspace</p>
      <p className="max-w-xs text-xs text-text-secondary">
        Reading your balances, drafts, and pipeline stages from the server.
      </p>
    </div>
  );
}
