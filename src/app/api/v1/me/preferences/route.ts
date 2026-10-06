import { z } from "zod";
import { requireSessionUser } from "@/server/auth/session";
import { updatePreferences } from "@/server/services/resumes";
import { ok, assertSameOrigin, route } from "@/server/http";

const patchSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  timezone: z.string().max(60).optional(),
  careerStage: z.enum(["student", "early_career", "experienced", "career_switcher"]).optional(),
  defaultMode: z.enum(["manual", "quick_ai", "agentic"]).optional(),
  targetRoles: z.array(z.string().max(120)).max(10).optional(),
  targetLocations: z.array(z.string().max(120)).max(10).optional(),
  notifyReminders: z.boolean().optional(),
  notifyProduct: z.boolean().optional(),
  dailyDigestEnabled: z.boolean().optional(),
});

export const PATCH = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireSessionUser();
  const body = patchSchema.parse(await req.json());
  await updatePreferences(user.id, body);
  return ok({ saved: true });
});
