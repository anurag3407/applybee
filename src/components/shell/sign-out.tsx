"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconBusy, IconExit } from "@/components/svg/icons";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/v1/auth/signout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="ab-press flex w-full items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-subtle disabled:opacity-50"
    >
      {busy ? <IconBusy size={15} /> : <IconExit size={15} />}
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
