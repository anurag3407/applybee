import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { OnboardingShell, StepProgress } from "@/components/auth/onboarding";
import { ResumeStep } from "@/components/auth/onboarding-steps";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingResumePage() {
  await requireActiveUser();
  return (
    <OnboardingShell step="resume">
      <StepProgress current="resume" />
      <ResumeStep />
    </OnboardingShell>
  );
}
