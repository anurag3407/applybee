"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, InlineError } from "@/components/ui/primitives";

export function ExportDeletionPanel({ mode }: { mode: "export" | "delete" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function act() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode === "export" ? "export" : "delete-account", confirm: confirmText }),
      });
      const data = (await res.json()) as { data?: { requestId?: string; deletionStarted?: boolean }; error?: { message?: string } };
      if (!res.ok || !data.data) throw new Error(data.error?.message ?? "Request failed.");
      if (mode === "export") {
        setDone("Export queued. It will be ready shortly and available for 24 hours.");
      } else {
        setDone("Deletion started. You have been signed out.");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {error ? <InlineError>{error}</InlineError> : null}
      {done ? (
        <p className="rounded-control border border-success/30 bg-success-wash px-3 py-2 text-sm text-success" role="status">
          {done}
        </p>
      ) : null}
      {mode === "delete" ? (
        <div className="max-w-xs">
          <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
          <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" maxLength={10} />
        </div>
      ) : null}
      <Button
        variant={mode === "delete" ? "danger" : "secondary"}
        onClick={act}
        disabled={busy || (mode === "delete" && confirmText !== "DELETE")}
      >
        {busy ? "Working…" : mode === "export" ? "Request export" : "Delete my account"}
      </Button>
    </div>
  );
}
