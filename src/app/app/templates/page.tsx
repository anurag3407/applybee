import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listTemplates } from "@/server/services/drafts";
import { Card, EmptyState, Button, Badge } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const user = await requireActiveUser();
  const rows = await listTemplates(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Templates</h2>
          <p className="text-sm text-text-secondary">
            Personal templates with deterministic placeholders. Applying one never calls AI and costs nothing.
          </p>
        </div>
        <Link href="/app/templates/new">
          <Button variant="primary">New template</Button>
        </Link>
      </div>
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
            <Card key={t.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/app/templates/${t.id}`} className="font-bold text-ink hover:underline">
                    {t.name}
                  </Link>
                  <p className="truncate text-sm text-text-secondary">{t.subject || "(no subject)"}</p>
                  <p className="text-xs text-text-disabled">Updated {relativeTime(t.updatedAt)}</p>
                </div>
                <Badge tone="success">Free to use</Badge>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
