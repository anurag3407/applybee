"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InlineError } from "@/components/ui/primitives";

/** Private opportunity notes. A client component because a server component
 * cannot pass an event handler into a form. */
export function OpportunityNotes({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/opportunities?id=${opportunityId}&action=note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? "The note could not be saved.");
      }
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The note could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 space-y-2" onSubmit={onSubmit}>
      {error ? <InlineError>{error}</InlineError> : null}
      <div className="flex gap-2">
        <textarea
          name="note"
          rows={2}
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a private note, e.g. “Spoke to Meera on Tuesday”"
          className="flex-1 rounded-control border border-border-control bg-surface px-3 py-2 text-ink"
        />
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="min-h-11 rounded-control bg-ink px-4 text-sm font-semibold text-surface hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Saving…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
