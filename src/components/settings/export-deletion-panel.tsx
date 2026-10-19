"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, InlineError } from "@/components/ui/primitives";

type ExportInfo = { id: string; state: string; downloadUrl: string | null };

export function ExportDeletionPanel({ mode }: { mode: "export" | "delete" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [exportInfo, setExportInfo] = useState<ExportInfo | null>(null);
  const [polling, setPolling] = useState(false);

  const readExport = useCallback(async (): Promise<ExportInfo | null> => {
    try {
      const res = await fetch("/api/v1/privacy");
      if (!res.ok) return null;
      const data = (await res.json()) as { data?: { export?: ExportInfo | null } };
      const info = data.data?.export ?? null;
      setExportInfo(info);
      return info;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (mode === "export") void readExport();
  }, [mode, readExport]);

  async function pollExport() {
    setPolling(true);
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const info = await readExport();
      if (info?.downloadUrl) break;
    }
    setPolling(false);
  }

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
        setDone("Export requested. Preparing your archive now.");
        setExportInfo({ id: data.data.requestId ?? "pending", state: "requested", downloadUrl: null });
        void pollExport();
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
      {mode === "export" && exportInfo ? (
        exportInfo.downloadUrl ? (
          <a
            href={exportInfo.downloadUrl}
            download
            className="ab-press inline-flex min-h-10 items-center rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft"
          >
            Download export (.json)
          </a>
        ) : exportInfo.state === "failed" ? (
          <p className="text-sm text-danger" role="alert">
            The export could not be prepared. Request another one or contact support.
          </p>
        ) : (
          <p className="text-sm text-text-secondary" role="status">
            {polling ? "Preparing your export…" : "Your export is still preparing."}{" "}
            {!polling ? (
              <button type="button" className="font-semibold text-ink underline" onClick={() => void pollExport()}>
                Check again
              </button>
            ) : null}
          </p>
        )
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
