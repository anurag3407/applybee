"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, InlineError } from "@/components/ui/primitives";

/** Connect/disconnect control; disconnect reuses the API with version bump. */
export function GmailConnectPanel({ connected, email, mode }: { connected: boolean; email: string | null; mode: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/gmail/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The API only connects the labeled sandbox when asked explicitly;
        // without this flag mock mode fell through to OAuth and did nothing.
        body: JSON.stringify({ returnPath: "/app/settings/integrations", sandbox: mode === "mock" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { data?: { authorizeUrl?: string; sandbox?: boolean }; error?: { message?: string } }
        | null;
      if (!res.ok) throw new Error(data?.error?.message ?? "Gmail connection could not start.");
      if (data?.data?.authorizeUrl) {
        window.location.href = data.data.authorizeUrl;
        return;
      }
      if (data?.data?.sandbox) {
        router.refresh();
        return;
      }
      throw new Error("Gmail connection could not start. Check the server configuration.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gmail connection could not start.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/gmail/connection", { method: "DELETE" });
      if (!res.ok) throw new Error("Gmail could not be disconnected. Please try again.");
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gmail could not be disconnected.");
    } finally {
      setBusy(false);
    }
  }

  if (connected) {
    return (
      <>
        <Button variant="secondary" onClick={() => setConfirmOpen(true)} disabled={busy}>
          Disconnect
        </Button>
        {confirmOpen ? (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-veil p-4" role="dialog" aria-modal="true" aria-label="Confirm disconnect">
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
    <div className="space-y-2">
      <Button variant="primary" onClick={connect} disabled={busy}>
        {busy ? "Connecting…" : mode === "mock" ? "Connect Gmail (sandbox)" : "Connect Gmail"}
      </Button>
      {error ? <InlineError>{error}</InlineError> : null}
    </div>
  );
}
