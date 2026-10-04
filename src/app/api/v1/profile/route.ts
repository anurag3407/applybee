import { z } from "zod";
import { getApiUser } from "@/server/auth/session";
import { getProfileForUser, saveProfileRevision, approveProfileRevision } from "@/server/services/resumes";
import { profileRevisionSchema } from "@/lib/validation";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const profile = await getProfileForUser(user.id);
    return ok(profile);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /profile/revisions — candidate correction/manual facts, immutable revision. */
export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const input = profileRevisionSchema.parse(await req.json());
    const result = await saveProfileRevision({ userId: user.id, input });
    return ok(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

const approveSchema = z.object({ revisionId: z.string().uuid() });

/** Confirm an existing (e.g. resume-extracted) revision's facts. */
export async function PUT(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getApiUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const body = approveSchema.parse(await req.json());
    await approveProfileRevision(user.id, body.revisionId);
    return ok({ approved: true });
  } catch (err) {
    return errorResponse(err);
  }
}
