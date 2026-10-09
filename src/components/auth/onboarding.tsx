import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";

export function OnboardingShell({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border-decorative bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Wordmark />
          <Link href="/app" className="text-sm font-semibold text-text-secondary hover:text-ink">
            Skip for now — go to workspace
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
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-sm" aria-label="Onboarding progress">
      {STEPS.map((s, i) => {
        const done = STEPS.findIndex((x) => x.key === current) > i;
        const active = s.key === current;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-pill px-3 py-1 font-semibold ${
                active ? "bg-ink text-surface" : done ? "bg-success-wash text-success" : "bg-surface-subtle text-text-secondary"
              }`}
            >
              <span aria-hidden className="tabular text-xs">{done ? "✓" : i + 1}</span>
              {s.label}
            </span>
            {i < STEPS.length - 1 ? <span aria-hidden className="text-text-disabled">→</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
