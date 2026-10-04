import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";
import { createOpportunity, listOpportunities, updateOpportunity, deleteOpportunity, addNote, OpportunityError } from "@/server/services/opportunities";
import { opportunitySchema, opportunitySchema as opSchema } from "@/lib/validation";
import { ok, errorResponse, assertSameOrigin } from "@/server/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    return ok({ opportunities: await listOpportunities(user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const body = opportunitySchema.parse(await req.json());
    const id = await createOpportunity(user.id, body);
    return ok({ opportunityId: id }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

const patchSchema = opSchema.partial();

export async function PATCH(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const opportunityId = url.searchParams.get("id");
    if (!opportunityId) return errorResponse(new Error("NOT_FOUND"));
    const body = patchSchema.parse(await req.json());
    await updateOpportunity(user.id, opportunityId, body);
    return ok({ saved: true });
  } catch (err) {
    if (err instanceof OpportunityError) return errorResponse(new Error("NOT_FOUND"));
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const opportunityId = url.searchParams.get("id");
    if (!opportunityId) return errorResponse(new Error("NOT_FOUND"));
    await deleteOpportunity(user.id, opportunityId);
    return ok({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}

const noteSchema = z.object({ body: z.string().min(1).max(5000) });

export async function PUT(req: Request) {
  try {
    await assertSameOrigin(req);
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const url = new URL(req.url);
    const opportunityId = url.searchParams.get("id");
    const action = url.searchParams.get("action");
    if (!opportunityId || action !== "note") return errorResponse(new Error("NOT_FOUND"));
    const body = noteSchema.parse(await req.json());
    const noteId = await addNote(user.id, opportunityId, body.body);
    return ok({ noteId }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
