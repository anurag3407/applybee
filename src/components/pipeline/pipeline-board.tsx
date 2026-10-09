"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge, Select } from "@/components/ui/primitives";
import { IconBusy, IconFlow } from "@/components/svg/icons";
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
      <div
        role="tablist"
        aria-label="Pipeline view"
        className="flex w-fit gap-1 rounded-control border border-border-decorative bg-surface p-1"
      >
        {(["board", "list"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              "ab-press min-h-9 rounded-control px-3 text-sm font-semibold transition-colors",
              view === v
                ? "bg-ink text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
                : "text-text-secondary hover:bg-surface-subtle hover:text-ink",
            )}
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
              <div
                key={s.key}
                className="min-w-44 rounded-card border border-border-decorative bg-surface p-3"
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <StageMark filled={items.length > 0} />
                  <h3 className="text-sm font-bold text-ink">{s.label}</h3>
                  <span className="tabular ml-auto text-xs font-semibold text-text-disabled">
                    {items.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((o) => (
                    <li
                      key={o.id}
                      className={cn(
                        "ab-lift rounded-control border border-border-decorative bg-canvas p-2.5",
                        busyId === o.id && "opacity-60",
                      )}
                    >
                      <Link
                        href={`/app/pipeline/${o.id}`}
                        className="text-sm font-bold text-ink hover:underline"
                      >
                        {o.roleTitle}
                      </Link>
                      <p className="text-xs text-text-secondary">{o.companyName}</p>
                      <div className="mt-2 flex items-center gap-1.5">
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
                        {busyId === o.id ? <IconBusy size={13} className="text-info" /> : null}
                      </div>
                    </li>
                  ))}
                  {items.length === 0 ? (
                    <li className="rounded-control border border-dashed border-border-decorative px-2.5 py-3 text-xs text-text-secondary">
                      Nothing here. Move an opportunity into {s.label.toLowerCase()} with the stage control on its
                      card.
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="divide-y divide-border-decorative rounded-card border border-border-decorative bg-surface">
          {opportunities.map((o) => (
            <li
              key={o.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle/60",
                busyId === o.id && "opacity-60",
              )}
            >
              <div>
                <Link href={`/app/pipeline/${o.id}`} className="font-bold text-ink hover:underline">
                  {o.roleTitle}
                </Link>
                <span className="text-text-secondary"> · {o.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                {o.nextActionAt ? (
                  <Badge tone="info">Next: {new Date(o.nextActionAt).toLocaleDateString("en-IN")}</Badge>
                ) : null}
                <Select
                  aria-label="Stage"
                  value={o.stage}
                  onChange={(e) => void setStage(o.id, e.target.value)}
                  className="h-9 w-44 text-sm"
                >
                  {stages.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </Select>
                {busyId === o.id ? <IconBusy size={14} className="text-info" /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Column marker: filled when the stage genuinely holds opportunities. */
function StageMark({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden>
      <path
        d="M6 1l5 2.9v6.2L6 13 1 10.1V3.9z"
        fill={filled ? "var(--ab-honey-wash)" : "none"}
        stroke={filled ? "var(--ab-honey-deep)" : "var(--ab-border-control)"}
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function CloseButton() {
  return (
    <Button variant="secondary" icon={<IconFlow size={15} />}>
      Close
    </Button>
  );
}
