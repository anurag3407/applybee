import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@/components/svg/icons";
import { requireActiveUser } from "@/server/auth/session";
import { listNotifications } from "@/server/services/opportunities";
import { NotificationActions } from "@/components/pipeline/notification-actions";
import { Card, Badge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

/**
 * A notice without a route to the thing it refers to is a dead end — the user
 * learns a draft finished, failed, or is waiting for review, and then has to go
 * find it. `source_entity` carries the subject of each kind.
 */
function notificationHref(n: { kind: string | null; sourceEntity: string | null }): string | null {
  if (!n.kind) return null;
  if (n.kind.startsWith("generation.") && n.sourceEntity?.startsWith("draft:")) {
    const id = n.sourceEntity.slice("draft:".length);
    return /^[0-9a-f-]{36}$/i.test(id) ? `/app/drafts/${id}` : null;
  }
  if (n.kind.startsWith("resume.")) return "/app/profile";
  return null;
}

function notificationCta(kind: string | null): string {
  if (kind?.startsWith("resume.")) return "Review your profile";
  return "Open the draft";
}

export default async function NotificationsPage() {
  const user = await requireActiveUser();
  const rows = await listNotifications(user.id);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Notifications</h2>
        <p className="text-sm text-text-secondary">
          In-app reminders and operational notices. Reminder emails, if you enable them, never contain draft content.
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState art="notifications" title="All clear" description="Reminders you set on opportunities and operational updates will appear here." />
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => {
            const href = notificationHref(n);
            return (
            <Card key={n.id} className={n.readAt ? "opacity-80" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">
                    {n.readAt ? null : <Badge tone="honey" className="mr-2">New</Badge>}
                    {n.title}
                  </p>
                  {n.body ? <p className="text-sm text-text-secondary">{n.body}</p> : null}
                  <p className="text-xs text-text-disabled">{formatDateTime(n.createdAt)}</p>
                  {href ? (
                    <Link href={href} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-ink underline">
                      {notificationCta(n.kind)} <IconArrowRight size={14} aria-hidden />
                    </Link>
                  ) : null}
                </div>
                <NotificationActions notificationId={n.id} read={Boolean(n.readAt)} />
              </div>
            </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
