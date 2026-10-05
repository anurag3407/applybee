import { redirect } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { createDraft } from "@/server/services/drafts";
import { db } from "@/db/client";
import { drafts as draftsTable, draftRevisions } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { z } from "zod";

/**
 * /app/drafts/new — creates an empty working draft (no credit debit, §19.2)
 * from URL-authorized parameters, then redirects into the editor.
 * Reuses an existing untouched empty draft if one was already minted recently.
 */
export default async function NewDraftPage({ searchParams }: { searchParams: Promise<{ contactId?: string; mode?: string; intent?: string }> }) {
  const user = await requireActiveUser();
  const sp = await searchParams;

  let contactId: string | undefined;
  if (sp.contactId && z.string().uuid().safeParse(sp.contactId).success) {
    contactId = sp.contactId;
  }
  const mode = (["manual", "quick_ai", "agentic"] as const).includes(sp.mode as "manual") ? (sp.mode as "manual") : "quick_ai";
  const intent = (["advertised_role", "internship", "intro", "referral", "follow_up"] as const).includes(sp.intent as "intro")
    ? (sp.intent as "intro")
    : "intro";

  // Check if there is an untouched empty draft for this user created within the last 15 minutes
  const existingDrafts = await db
    .select({ id: draftsTable.id })
    .from(draftsTable)
    .innerJoin(draftRevisions, eq(draftRevisions.id, draftsTable.currentRevisionId))
    .where(
      and(
        eq(draftsTable.userId, user.id),
        eq(draftsTable.status, "active"),
        eq(draftsTable.mode, mode),
        contactId ? eq(draftsTable.contactId, contactId) : sql`${draftsTable.contactId} IS NULL`,
        sql`(${draftRevisions.subject} = '' OR ${draftRevisions.subject} IS NULL)`,
        sql`(${draftRevisions.body} = '' OR ${draftRevisions.body} IS NULL)`,
        sql`${draftsTable.createdAt} > now() - interval '15 minutes'`
      )
    )
    .orderBy(desc(draftsTable.createdAt))
    .limit(1);

  if (existingDrafts.length > 0 && existingDrafts[0]?.id) {
    redirect(`/app/drafts/${existingDrafts[0].id}`);
  }

  const id = await createDraft({
    userId: user.id,
    mode,
    intent,
    ...(contactId ? { recipient: { kind: "directory" as const, contactId } } : {}),
  });

  redirect(`/app/drafts/${id}`);
}
