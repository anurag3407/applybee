import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { OnboardingShell, StepProgress } from "@/components/auth/onboarding";
import { ProfileStep } from "@/components/auth/onboarding-steps";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingProfilePage() {
  await requireActiveUser();
  return (
    <OnboardingShell step="profile">
      <StepProgress current="profile" />
      <ProfileStep />
    </OnboardingShell>
  );
}
