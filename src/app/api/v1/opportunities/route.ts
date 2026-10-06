import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import {
  createOpportunity,
  listOpportunities,
  updateOpportunity,
  deleteOpportunity,
  addNote,
  OpportunityError,
} from "@/server/services/opportunities";
import { opportunitySchema } from "@/lib/validation";
import { ok, errorResponse, assertSameOrigin, requireSearchParam, route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireApiUser();
  return ok({ opportunities: await listOpportunities(user.id) });
});

export const POST = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const body = opportunitySchema.parse(await req.json());
  const id = await createOpportunity(user.id, body);
  return ok({ opportunityId: id }, 201);
});

const patchSchema = opportunitySchema.partial();

/**
 * The service raises `OpportunityError` with human copy ("Opportunity not
 * found."), which the sentinel matcher in `errorResponse` cannot recognise, so
 * this handler keeps its own mapping to the NOT_FOUND envelope.
 */
export const PATCH = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const opportunityId = requireSearchParam(req, "id");
  const body = patchSchema.parse(await req.json());
  await updateOpportunity(user.id, opportunityId, body);
  return ok({ saved: true });
});

export const DELETE = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const opportunityId = requireSearchParam(req, "id");
  await deleteOpportunity(user.id, opportunityId);
  return ok({ deleted: true });
});

const noteSchema = z.object({ body: z.string().min(1).max(5000) });

export const PUT = route(async (req: Request) => {
  await assertSameOrigin(req);
  const user = await requireApiUser();
  const url = new URL(req.url);
  const opportunityId = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  if (!opportunityId || action !== "note") return errorResponse(new Error("NOT_FOUND"));
  const body = noteSchema.parse(await req.json());
  const noteId = await addNote(user.id, opportunityId, body.body);
  return ok({ noteId }, 201);
});
