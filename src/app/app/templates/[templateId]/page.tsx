import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { templates } from "@/db/schema";
import { requireActiveUser } from "@/server/auth/session";
import { TemplateEditor } from "@/components/composer/template-editor";
import { AppPageHeader } from "@/components/shell/app-page-header";
import type { TemplateVariable } from "@/lib/validation";

export default async function TemplateEditorPage({ params }: { params: Promise<{ templateId: string }> }) {
  const user = await requireActiveUser();
  const { templateId } = await params;
  const rows = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, templateId), eq(templates.userId, user.id)))
    .limit(1);
  const t = rows[0];
  if (!t) notFound();
  const sample: Partial<Record<TemplateVariable, string>> = {
    candidate_name: user.displayName ?? "Aarav",
    recipient_first_name: "Priya",
    company_name: "Lumen Analytics",
    target_role: "Platform engineer",
    achievement: "your project with realtime pipelines",
    portfolio_url: "https://portfolio.example.com",
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <AppPageHeader title="Edit template" lede="Reusable subject and body for the drafts you write." />
      <TemplateEditor
        templateId={t.id}
        initial={{ name: t.name, subject: t.subject, body: t.body, version: t.version }}
        sample={sample}
      />
    </div>
  );
}
