import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listDrafts } from "@/server/services/drafts";
import { Badge, Card, EmptyState, Button } from "@/components/ui/primitives";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Drafts" };

const MODE_LABEL: Record<string, string> = { manual: "Manual", quick_ai: "Quick AI", agentic: "Agentic" };

export default async function DraftsPage() {
  const user = await requireActiveUser();
  const rows = await listDrafts(user.id);
  const active = rows.filter((r) => r.status !== "deleted");
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Drafts</h2>
          <p className="text-sm text-text-secondary">Every draft, its mode, and where it stands.</p>
        </div>
        <Link href="/app/drafts/new">
          <Button variant="primary">New draft</Button>
        </Link>
      </div>
      {active.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          description="Start with a blank editor, a template, or a quick AI draft — manual writing is always free."
          action={
            <Link href="/app/drafts/new">
              <Button variant="accent">Create your first draft</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {active.map((d) => (
            <Card key={d.id}>
              <Link href={`/app/drafts/${d.id}`} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{d.subject || "(no subject)"}</p>
                  <p className="text-xs text-text-secondary">
                    {MODE_LABEL[d.mode] ?? d.mode} · v{d.version} · updated {relativeTime(d.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {d.status === "generating" ? <Badge tone="info">Generating…</Badge> : <Badge>Draft</Badge>}
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
