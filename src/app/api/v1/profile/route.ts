import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { getProfileForUser, saveProfileRevision, approveProfileRevision } from "@/server/services/resumes";
import { profileRevisionSchema } from "@/lib/validation";
import { ok, assertSameOrigin, route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireApiUser();
  const profile = await getProfileForUser(user.id);
  return ok(profile);
});

/** POST /profile/revisions — candidate correction/manual facts, immutable revision. */
export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const input = profileRevisionSchema.parse(await req.json());
  const result = await saveProfileRevision({ userId: user.id, input });
  return ok(result, 201);
});

const approveSchema = z.object({
  revisionId: z.string().uuid(),
  /**
   * The facts to confirm. Omitted means "all of them", which is what the review
   * screen used to force: one wrong line parsed from a resume could only be
   * handled by deleting it, so a user either accepted a lie about themselves or
   * lost the line with the rest.
   */
  factIds: z.array(z.string().uuid()).min(1).max(40).optional(),
});

/** Confirm an existing (e.g. resume-extracted) revision's facts. */
export const PUT = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const body = approveSchema.parse(await req.json());
  await approveProfileRevision(user.id, body.revisionId, body.factIds);
  return ok({ approved: true });
});
