import { redirect } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { createDraft } from "@/server/services/drafts";
import { db } from "@/db/client";
import { drafts as draftsTable } from "@/db/schema";
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

  // Reuse a still-untouched draft minted minutes ago so repeat visits do not
  // pile up empty shells in the list. "Untouched" has to be judged from the
  // revisions: drafts.current_revision_id stays NULL until a proposal is
  // accepted (only accept_generated_proposal writes it), so joining on it made
  // this query unsatisfiable and every visit created a new row.
  const existingDrafts = await db
    .select({ id: draftsTable.id })
    .from(draftsTable)
    .where(
      and(
        eq(draftsTable.userId, user.id),
        eq(draftsTable.status, "active"),
        eq(draftsTable.mode, mode),
        eq(draftsTable.intent, intent),
        contactId ? eq(draftsTable.contactId, contactId) : sql`${draftsTable.contactId} IS NULL`,
        sql`${draftsTable.createdAt} > now() - interval '15 minutes'`,
        sql`NOT EXISTS (
          SELECT 1 FROM draft_revisions r
          WHERE r.draft_id = ${draftsTable.id} AND (r.subject <> '' OR r.body <> '')
        )`,
      ),
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
