"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge, Select } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type Opp = { id: string; companyName: string; roleTitle: string; stage: string; nextActionAt: string | null };
type Stage = { key: string; label: string };

/**
 * Pipeline board (§12.5): stage change via accessible dropdown — drag-and-drop
 * is never the only way to change state (§8.4/§30).
 */
export function PipelineBoard({ stages, opportunities }: { stages: Stage[]; opportunities: Opp[] }) {
  const [view, setView] = useState<"board" | "list">("board");
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStage(id: string, stage: string) {
    setBusyId(id);
    await fetch(`/api/v1/opportunities?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Pipeline view" className="flex gap-1 rounded-control border border-border-decorative bg-surface p-1 w-fit">
        {(["board", "list"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`min-h-9 rounded-control px-3 text-sm font-semibold ${view === v ? "bg-ink text-surface" : "text-text-secondary"}`}
          >
            {v === "board" ? "Columns" : "List"}
          </button>
        ))}
      </div>

      {view === "board" ? (
        <div className="grid gap-3 overflow-x-auto md:grid-cols-4 xl:grid-cols-7">
          {stages.map((s) => {
            const items = opportunities.filter((o) => o.stage === s.key);
            return (
              <div key={s.key} className="min-w-44 rounded-card border border-border-decorative bg-surface p-3">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">
                  {s.label} <span className="tabular text-text-disabled">({items.length})</span>
                </h3>
                <ul className="space-y-2">
                  {items.map((o) => (
                    <li key={o.id} className="rounded-control border border-border-decorative bg-canvas p-2.5">
                      <Link href={`/app/pipeline/${o.id}`} className="text-sm font-bold text-ink hover:underline">
                        {o.roleTitle}
                      </Link>
                      <p className="text-xs text-text-secondary">{o.companyName}</p>
                      <div className="mt-2">
                        {/* Explicit stage dropdown — accessible alternative to drag. */}
                        <Select
                          aria-label={`Stage for ${o.roleTitle} at ${o.companyName}`}
                          value={o.stage}
                          disabled={busyId === o.id}
                          onChange={(e) => void setStage(o.id, e.target.value)}
                          className="h-8 text-xs"
                        >
                          {stages.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 ? <li className="text-xs text-text-disabled">—</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="divide-y divide-border-decorative rounded-card border border-border-decorative bg-surface">
          {opportunities.map((o) => (
            <li key={o.id} className={cn("flex flex-wrap items-center justify-between gap-3 px-4 py-3", busyId === o.id && "opacity-60")}>
              <div>
                <Link href={`/app/pipeline/${o.id}`} className="font-bold text-ink hover:underline">
                  {o.roleTitle}
                </Link>
                <span className="text-text-secondary"> · {o.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                {o.nextActionAt ? <Badge tone="info">Next: {new Date(o.nextActionAt).toLocaleDateString("en-IN")}</Badge> : null}
                <Select aria-label="Stage" value={o.stage} onChange={(e) => void setStage(o.id, e.target.value)} className="h-9 w-44 text-sm">
                  {stages.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CloseButton() {
  return <Button variant="secondary">Close</Button>;
}
