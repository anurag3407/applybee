"use client";

import { useRef, useState } from "react";
import { IconUpload } from "@/components/svg/icons";
import { Button } from "@/components/ui/primitives";

const MAX_BYTES = 5 * 1024 * 1024;

/** PDF-only upload (§14): create intent → PUT bytes → finalize server-side. */
export function UploadZone({ onDone }: { onDone?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The file is larger than 5 MiB. Upload a smaller PDF or add your experience manually.");
      return;
    }
    setBusy(true);
    setFilename(file.name);
    try {
      const intentRes = await fetch("/api/v1/uploads/resume", { method: "POST" });
      if (!intentRes.ok) {
        const body = (await intentRes.json()) as { error?: { message?: string; code?: string } };
        throw new Error(body.error?.message ?? "Upload could not start.");
      }
      const intent = (await intentRes.json()) as { data: { uploadIntentId: string } };
      const bytes = await file.arrayBuffer();
      const putRes = await fetch("/api/v1/uploads/resume", {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
          "x-upload-intent-id": intent.data.uploadIntentId,
          "x-filename": file.name,
        },
        body: bytes,
      });
      if (!putRes.ok) {
        const body = (await putRes.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Upload failed.");
      }
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      className="rounded-control border-2 border-dashed border-border-decorative bg-canvas p-6 text-center"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <IconUpload size={24} aria-hidden className="mx-auto text-text-secondary" />
      {filename ? (
        <p className="mt-2 text-sm font-semibold text-ink" aria-live="polite">
          {busy ? `Uploading ${filename}…` : `${filename} uploaded`}
        </p>
      ) : (
        <p className="mt-2 text-sm text-text-secondary">Drag a PDF here or choose a file</p>
      )}
      <p className="mt-1 text-xs text-text-disabled">PDF only · max 5 MiB · 10 pages</p>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? "Uploading…" : "Choose file"}
      </Button>
    </div>
  );
}
