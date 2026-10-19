"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, InlineError } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";

export function DeleteTemplateButton({ templateId, name }: { templateId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/templates?id=${templateId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? "The template could not be deleted.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The template could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title="Delete template?">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            “{name}” will be removed. Drafts already written from it keep their text.
          </p>
          {error ? <InlineError>{error}</InlineError> : null}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
              {busy ? "Deleting…" : "Delete template"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
