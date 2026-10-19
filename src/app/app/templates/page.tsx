import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listTemplates } from "@/server/services/drafts";
import { Card, Button, Badge } from "@/components/ui/primitives";

import { EmptyState } from "@/components/ui/empty-state";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { relativeTime } from "@/lib/format";
import { DeleteTemplateButton } from "@/components/composer/delete-template";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const user = await requireActiveUser();
  const rows = await listTemplates(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <AppPageHeader
        title="Templates"
        lede="Personal templates with deterministic placeholders. Applying one never calls AI and costs nothing."
        actions={
          <Link href="/app/templates/new">
            <Button variant="primary">New template</Button>
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          art="templates"
          title="No templates yet"
          description="Create a reusable structure with placeholders like {{recipient_first_name}} and {{achievement}}."
          action={
            <Link href="/app/templates/new">
              <Button variant="accent">Create a template</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <Card key={t.id} as="li">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/app/templates/${t.id}`} className="font-bold text-ink hover:underline">
                    {t.name}
                  </Link>
                  <p className="truncate text-sm text-text-secondary">{t.subject || "(no subject)"}</p>
                  <p className="text-xs text-text-disabled">Updated {relativeTime(t.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="success">Free to use</Badge>
                  <Link
                    href={`/app/drafts/new?template=${t.id}`}
                    className="ab-press inline-flex min-h-9 items-center rounded-control border border-border-control bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-subtle"
                  >
                    Use in a draft
                  </Link>
                  <DeleteTemplateButton templateId={t.id} name={t.name} />
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
