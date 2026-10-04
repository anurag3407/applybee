import { getSessionUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { getPreferences } from "@/server/services/resumes";
import { ok, errorResponse } from "@/server/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
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
  } catch (err) {
    return errorResponse(err);
  }
}
