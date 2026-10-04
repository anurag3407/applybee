import { redirect } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { createDraft } from "@/server/services/drafts";
import { db } from "@/db/client";
import { drafts as draftsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

/**
 * /app/drafts/new — creates an empty working draft (no credit debit, §19.2)
 * from URL-authorized parameters, then redirects into the editor.
 */
export default async function NewDraftPage({ searchParams }: { searchParams: Promise<{ contactId?: string; mode?: string; intent?: string }> }) {
  const user = await requireActiveUser();
  const sp = await searchParams;

  let contactId: string | undefined;
  if (sp.contactId && z.string().uuid().safeParse(sp.contactId).success) {
    contactId = sp.contactId;
  }
  const mode = (["manual", "quick_ai", "agentic"] as const).includes(sp.mode as "manual") ? (sp.mode as "manual") : "manual";
  const intent = (["advertised_role", "internship", "intro", "referral", "follow_up"] as const).includes(sp.intent as "intro")
    ? (sp.intent as "intro")
    : "intro";

  const id = await createDraft({
    userId: user.id,
    mode,
    intent,
    ...(contactId ? { recipient: { kind: "directory" as const, contactId } } : {}),
  });

  // If this user created it via a template POST elsewhere, nothing else here.
  void draftsTable;
  void and;
  void eq;
  void db;

  redirect(`/app/drafts/${id}`);
}
