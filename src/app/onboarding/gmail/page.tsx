import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { OnboardingShell, StepProgress } from "@/components/auth/onboarding";
import { GmailStep } from "@/components/auth/onboarding-steps";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingGmailPage() {
  await requireActiveUser();
  return (
    <OnboardingShell step="gmail">
      <StepProgress current="gmail" />
      <GmailStep />
    </OnboardingShell>
  );
}
