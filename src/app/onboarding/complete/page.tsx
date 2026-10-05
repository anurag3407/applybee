import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { setOnboardingStep } from "@/server/services/resumes";
import { OnboardingShell, StepProgress } from "@/components/auth/onboarding";
import { PreferencesStep } from "@/components/auth/onboarding-steps";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingCompletePage() {
  const user = await requireActiveUser();
  await setOnboardingStep(user.id, "complete", true);
  const balances = await getBalances(user.id);
  return (
    <OnboardingShell step="complete">
      <StepProgress current="complete" />
      <Card>
        <h2 className="text-xl font-bold text-ink">You’re set up.</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your current balances, straight from your account (not a marketing promise):
        </p>
        <ul className="mt-3 space-y-1 text-sm text-ink">
          <li>• {balances.contact.available} contact reveals</li>
          <li>• {balances.ai.available} AI generations</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/contacts" className="rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:bg-ink-soft shadow-sm">
            ⚡ Find contacts & start outreach
          </Link>
          <Link href="/app" className="rounded-control border border-border-control px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle">
            Go to dashboard
          </Link>
        </div>
      </Card>
    </OnboardingShell>
  );
}
