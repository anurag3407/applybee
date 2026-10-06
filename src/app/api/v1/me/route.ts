import { requireSessionUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { getPreferences } from "@/server/services/resumes";
import { ok, route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireSessionUser();
  const balances = await getBalances(user.id);
  const { prefs } = await getPreferences(user.id);
  return ok({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    onboardingStep: user.onboardingStep,
    isAdmin: user.isAdmin,
    authMode: user.authMode,
    balances,
    preferences: prefs,
  });
});
