import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listDrafts } from "@/server/services/drafts";
import { Card, EmptyState, Button, StatusChip } from "@/components/ui/primitives";
import { IconArrowRight, IconCompose } from "@/components/svg/icons";
import { Reveal, Stagger } from "@/components/motion";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Drafts" };

const MODE_LABEL: Record<string, string> = { manual: "Manual", quick_ai: "Quick AI", agentic: "Agentic" };

export default async function DraftsPage() {
  const user = await requireActiveUser();
  const rows = await listDrafts(user.id);
  const active = rows.filter((r) => r.status !== "deleted");
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Reveal className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Drafts</h2>
          <p className="text-sm text-text-secondary">Every draft, its mode, and where it stands.</p>
        </div>
        <Link href="/app/drafts/new">
          <Button icon={<IconCompose size={15} />}>New draft</Button>
        </Link>
      </Reveal>
      {active.length === 0 ? (
        <Reveal delay={60}>
          <EmptyState
            art="drafts"
            title="No drafts yet"
            description="Start with a blank editor, a template, or a quick AI draft. Manual writing is always free."
            action={
              <Link href="/app/drafts/new">
                <Button variant="accent" icon={<IconCompose size={15} />}>
                  Create your first draft
                </Button>
              </Link>
            }
          />
        </Reveal>
      ) : (
        <Stagger as="ul" className="space-y-3">
          {active.map((d) => (
            <li key={d.id}>
              <Card interactive className="p-0">
                <Link
                  href={`/app/drafts/${d.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{d.subject || "(no subject)"}</p>
                    <p className="text-xs text-text-secondary">
                      {MODE_LABEL[d.mode] ?? d.mode} · v{d.version} · updated {relativeTime(d.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.status === "generating" ? (
                      <StatusChip status="info" busy label="Generating" />
                    ) : (
                      <StatusChip status="neutral" label="Draft" />
                    )}
                    <IconArrowRight
                      size={15}
                      className="ab-slide-icon shrink-0 text-text-disabled group-hover:text-ink"
                    />
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </Stagger>
      )}
    </div>
  );
}
