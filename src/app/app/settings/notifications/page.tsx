import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Notification preferences" };

export default async function SettingsNotificationsPage() {
  await requireActiveUser();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-ink">Notification preferences</h2>
      <Card>
        <h3 className="font-bold text-ink">Channels</h3>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          <li>
            <strong className="text-ink">In-app (always on):</strong> opportunity reminders and operational notices. Manage
            from{" "}
            <Link href="/app/notifications" className="text-info underline">
              Notifications
            </Link>
            .
          </li>
          <li>
            <strong className="text-ink">Email reminders:</strong> controlled by the switch in{" "}
            <Link href="/app/settings/profile" className="text-info underline">
              Profile settings
            </Link>
            . Reminder emails never contain draft content or contact emails.
          </li>
          <li>
            <strong className="text-ink">Transactional email:</strong> receipts and security notices are sent regardless of
            marketing preferences, because you need them.
          </li>
        </ul>
      </Card>
      <Card>
        <h3 className="font-bold text-ink">What we will never send</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Automatic follow-ups to your contacts, outreach on your behalf, or inbox-derived notifications. Apply Bee
          doesn’t read your inbox.
        </p>
      </Card>
    </div>
  );
}
