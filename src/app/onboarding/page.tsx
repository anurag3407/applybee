import { redirect } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";

/** /onboarding resolves the next incomplete step and resumes (§11.4). */
export default async function OnboardingIndexPage() {
  const user = await requireActiveUser();
  if (user.onboardingStep === "complete") redirect("/app");
  // Gmail is deliberately not a step: it is asked for at the first delivery, where
  // its value is obvious, instead of before the user has drafted anything.
  const stepOrder = ["profile", "resume", "complete"];
  if (!stepOrder.includes(user.onboardingStep)) redirect("/onboarding/profile");
  redirect(`/onboarding/${user.onboardingStep}`);
}
