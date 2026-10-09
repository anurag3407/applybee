import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { StageChain } from "@/components/svg/composite";

export function OnboardingShell({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border-decorative bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Wordmark />
          <Link
            href="/app"
            className="ab-press rounded-control px-2 py-1 text-sm font-semibold text-text-secondary hover:bg-surface-subtle hover:text-ink"
          >
            Skip for now, go to workspace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>
    </div>
  );
}

const STEPS: Array<{ key: string; label: string }> = [
  { key: "profile", label: "Your profile" },
  { key: "resume", label: "Resume (optional)" },
  { key: "complete", label: "Done" },
];

export function StepProgress({ current }: { current: string }) {
  const index = Math.max(0, STEPS.findIndex((x) => x.key === current));
  return (
    <div className="mb-8" aria-label="Onboarding progress">
      <StageChain items={STEPS} currentIndex={index} orientation="horizontal" />
    </div>
  );
}
