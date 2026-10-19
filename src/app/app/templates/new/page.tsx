import { requireActiveUser } from "@/server/auth/session";
import { TemplateEditor } from "@/components/composer/template-editor";
import { AppPageHeader } from "@/components/shell/app-page-header";

export default async function NewTemplatePage() {
  await requireActiveUser();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <AppPageHeader title="New template" lede="Reusable subject and body for the drafts you write." />
      <TemplateEditor templateId={null} initial={{ name: "", subject: "", body: "", version: 1 }} sample={{}} />
    </div>
  );
}
