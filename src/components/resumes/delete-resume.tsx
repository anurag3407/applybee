"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@/components/svg/icons";
import { Button } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";

export function DeleteResumeButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    await fetch(`/api/v1/resumes?id=${resumeId}`, { method: "DELETE" });
    setBusy(false);
    setOpen(false);
    router.refresh();
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
        <p className="text-sm text-text-secondary">
          The stored file is deleted. Existing Gmail drafts with this attachment keep their copies. ReachBee cannot
          remove those. Pending approvals that reference this file are invalidated.
        </p>
      </Dialog>
    </>
  );
}
