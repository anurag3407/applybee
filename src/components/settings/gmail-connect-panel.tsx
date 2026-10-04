"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";

/** Connect/disconnect control; disconnect reuses the API with version bump. */
export function GmailConnectPanel({ connected, email, mode }: { connected: boolean; email: string | null; mode: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function connect() {
    setBusy(true);
    const res = await fetch("/api/v1/gmail/connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath: "/app/settings/integrations" }),
    });
    const data = (await res.json()) as { data?: { authorizeUrl?: string }; error?: { message?: string } };
    if (data.data?.authorizeUrl) {
      window.location.href = data.data.authorizeUrl;
      return;
    }
    setBusy(false);
  }

  async function disconnect() {
    setBusy(true);
    await fetch("/api/v1/gmail/connection", { method: "DELETE" });
    setBusy(false);
    setConfirmOpen(false);
    router.refresh();
  }

  if (connected) {
    return (
      <>
        <Button variant="secondary" onClick={() => setConfirmOpen(true)} disabled={busy}>
          Disconnect
        </Button>
        {confirmOpen ? (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label="Confirm disconnect">
            <div className="w-full max-w-md rounded-card border border-border-decorative bg-surface p-5 shadow-dialog">
              <h3 className="text-lg font-bold text-ink">Disconnect Gmail?</h3>
              <p className="mt-2 text-sm text-text-secondary">
                {email} will be disconnected. Queued deliveries will be blocked, and new draft creation will pause until
                you reconnect. Drafts already created in Gmail stay there.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={disconnect} disabled={busy}>
                  {busy ? "Disconnecting…" : "Disconnect"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <Button variant="primary" onClick={connect} disabled={busy}>
      {busy ? "Redirecting…" : mode === "mock" ? "Connect Gmail (sandbox)" : "Connect Gmail"}
    </Button>
  );
}
