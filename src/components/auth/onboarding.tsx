import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { StageChain } from "@/components/svg/composite";

export function OnboardingShell({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border-decorative bg-surface">
        <div className="mx-auto flex h-[3.75rem] max-w-3xl items-center justify-between px-5">
          <Wordmark />
          <Link
            href="/onboarding/complete"
            className="ab-press rounded-control px-2 py-1 text-[0.8125rem] font-semibold text-text-secondary underline decoration-border-control/60 underline-offset-4 hover:text-ink"
          >
            Skip for now
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-6">
          <p className="text-xs font-semibold text-text-secondary">Onboarding</p>
          <h1 className="mt-1 text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-ink">
            Set up your outreach workspace
          </h1>
        </div>
        {children}
      </main>
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
