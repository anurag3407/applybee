import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { OnboardingShell, StepProgress } from "@/components/auth/onboarding";
import { CompleteStep } from "@/components/auth/onboarding-steps";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingCompletePage() {
  const user = await requireActiveUser();
  const balances = await getBalances(user.id);
  return (
    <OnboardingShell step="complete">
      <StepProgress current="complete" />
      <CompleteStep contactCredits={balances.contact.available} aiCredits={balances.ai.available} />
    </OnboardingShell>
  );
}
