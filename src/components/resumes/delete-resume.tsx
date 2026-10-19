"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@/components/svg/icons";
import { Button, InlineError } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";

export function DeleteResumeButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/resumes?id=${resumeId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? "The resume could not be deleted.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The resume could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label="Delete resume">
        <IconTrash size={14} aria-hidden /> Delete
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this resume?"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={confirmDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete file"}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            The stored file is deleted. Existing Gmail drafts with this attachment keep their copies. ReachBee cannot
            remove those. Pending approvals that reference this file are invalidated.
          </p>
          {error ? <InlineError>{error}</InlineError> : null}
        </div>
      </Dialog>
    </>
  );
}
