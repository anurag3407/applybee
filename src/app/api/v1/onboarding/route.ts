import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { setOnboardingStep } from "@/server/services/resumes";
import { ok, assertSameOrigin, route } from "@/server/http";

const bodySchema = z.object({ step: z.literal("complete") });

/**
 * Mark onboarding finished.
 *
 * This used to run inside the `/onboarding/complete` server component, so a
 * prefetch, a re-render or a refresh wrote the row from a GET. Nothing in the
 * product reads `onboarding_step` except the `/onboarding` resolver, so an
 * explicit action here costs one request and keeps reads free of side effects.
 */
export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const body = bodySchema.parse(await req.json());
  await setOnboardingStep(user.id, body.step, true);
  return ok({ step: body.step });
});
