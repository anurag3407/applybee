"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";

export function NotificationActions({ notificationId, read }: { notificationId: string; read: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "read" | "dismiss") {
    setBusy(true);
    await fetch(`/api/v1/notifications?id=${notificationId}&action=${action}`, { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {!read ? (
        <Button size="sm" variant="secondary" onClick={() => act("read")} disabled={busy}>
          Mark read
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => act("dismiss")} disabled={busy}>
        Dismiss
      </Button>
    </div>
  );
}
