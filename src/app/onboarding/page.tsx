import { redirect } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";

/** /onboarding resolves the next incomplete step and resumes (§11.4). */
export default async function OnboardingIndexPage() {
  const user = await requireActiveUser();
  if (user.onboardingStep === "complete") redirect("/app");
  const stepOrder = ["profile", "resume", "gmail", "preferences", "complete"];
  if (!stepOrder.includes(user.onboardingStep)) redirect("/onboarding/profile");
  redirect(`/onboarding/${user.onboardingStep}`);
}
