"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select } from "@/components/ui/primitives";
import { STAGE_LABELS } from "@/components/pipeline/stages";

/** Stage picker + next-action date; timezone-safe via datetime-local + IANA tz. */
export function StageControls({
  opportunityId,
  stage,
  nextActionAt,
}: {
  opportunityId: string;
  stage: string;
  nextActionAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [currentStage, setCurrentStage] = useState(stage);
  const [when, setWhen] = useState(
    nextActionAt ? new Date(nextActionAt).toISOString().slice(0, 16) : "",
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const payload: Record<string, unknown> = { stage: currentStage };
    payload.nextActionAt = when ? new Date(when).toISOString() : null;
    await fetch(`/api/v1/opportunities?id=${opportunityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3" id={`stage-form-${opportunityId}`}>
      <div>
        <Label htmlFor={`stage-${opportunityId}`}>Stage</Label>
        <Select id={`stage-${opportunityId}`} value={currentStage} onChange={(e) => setCurrentStage(e.target.value)} className="w-52">
          {STAGE_LABELS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={`when-${opportunityId}`}>Next action</Label>
        <Input id={`when-${opportunityId}`} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
