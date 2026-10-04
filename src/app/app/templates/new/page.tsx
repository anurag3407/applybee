import { requireActiveUser } from "@/server/auth/session";
import { TemplateEditor } from "@/components/composer/template-editor";

export default async function NewTemplatePage() {
  await requireActiveUser();
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-ink">New template</h2>
      <TemplateEditor templateId={null} initial={{ name: "", subject: "", body: "", version: 1 }} sample={{}} />
    </div>
  );
}
