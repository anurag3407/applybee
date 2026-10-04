import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { listNotifications } from "@/server/services/opportunities";
import { NotificationActions } from "@/components/pipeline/notification-actions";
import { Card, EmptyState, Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

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
        <EmptyState title="All clear" description="Reminders you set on opportunities and operational updates will appear here." />
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <Card key={n.id} className={n.readAt ? "opacity-80" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">
                    {n.readAt ? null : <Badge tone="honey" className="mr-2">New</Badge>}
                    {n.title}
                  </p>
                  {n.body ? <p className="text-sm text-text-secondary">{n.body}</p> : null}
                  <p className="text-xs text-text-disabled">{formatDateTime(n.createdAt)}</p>
                </div>
                <NotificationActions notificationId={n.id} read={Boolean(n.readAt)} />
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
