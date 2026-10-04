"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button, Badge, Input, Label, Select } from "@/components/ui/primitives";

type Fact = { id: string; factType: string; text: string; approved: boolean; sourceRef?: string | null };

/** ProfileFactEditor (§24.2): confirm/correct extracted facts; immutable revisions. */
export function ProfileFactsEditor({
  revisionId,
  revisionNo,
  source,
  approved,
  extracted,
  facts: initialFacts,
}: {
  revisionId: string;
  revisionNo: number;
  source: string;
  approved: boolean;
  extracted: { summary?: string | null; targetRole?: string | null } | null;
  facts: Fact[];
}) {
  const router = useRouter();
  const [facts, setFacts] = useState(initialFacts);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("skill");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const allApproved = facts.length > 0 && facts.every((f) => f.approved);

  async function approveRevision() {
    setBusy(true);
    await fetch("/api/v1/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });
    setBusy(false);
    setSaved("Facts confirmed — they're now usable in AI drafts.");
    router.refresh();
  }

  async function saveAsRevision() {
    setBusy(true);
    const res = await fetch("/api/v1/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facts: facts.map((f) => ({ factType: f.factType, text: f.text })),
        approve: true,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved("Saved as a new revision.");
      router.refresh();
    }
  }

  function removeFact(id: string) {
    setFacts((fs) => fs.filter((f) => f.id !== id));
  }

  function addFact() {
    if (newText.trim().length < 3) return;
    setFacts((fs) => [...fs, { id: `new-${Date.now()}`, factType: newType, text: newText.trim(), approved: true }]);
    setNewText("");
  }

  return (
    <div className="rounded-card border border-border-decorative bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-ink">Revision {revisionNo}</h3>
          <p className="text-xs text-text-secondary">
            Source: {source === "resume" ? "Resume parse" : "Manual entry"}
            {approved ? " · confirmed" : " · awaiting review"}
          </p>
        </div>
        {allApproved && approved ? <Badge tone="success">Confirmed</Badge> : <Badge tone="warning">Needs review</Badge>}
      </div>

      {extracted?.summary ? <p className="mt-3 rounded-control bg-canvas px-3 py-2 text-sm text-text-secondary">{extracted.summary}</p> : null}

      <ul className="mt-4 space-y-2">
        {facts.map((f) => (
          <li key={f.id} className="flex items-start gap-2 rounded-control border border-border-decorative bg-canvas px-3 py-2">
            <Badge tone={f.approved ? "success" : "warning"}>{f.factType}</Badge>
            <p className="flex-1 text-sm text-ink">{f.text}</p>
            <button
              onClick={() => removeFact(f.id)}
              aria-label="Remove fact from this revision"
              className="rounded p-1 text-text-secondary hover:bg-surface-subtle hover:text-danger"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </li>
        ))}
        {facts.length === 0 ? <li className="text-sm text-text-secondary">No facts yet — add a few below.</li> : null}
      </ul>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor="new-type">Type</Label>
          <Select id="new-type" value={newType} onChange={(e) => setNewType(e.target.value)} className="w-40">
            <option value="experience">Experience</option>
            <option value="project">Project</option>
            <option value="skill">Skill</option>
            <option value="achievement">Achievement</option>
            <option value="education">Education</option>
            <option value="link">Link</option>
          </Select>
        </div>
        <div className="min-w-56 flex-1">
          <Label htmlFor="new-fact">Fact</Label>
          <Input
            id="new-fact"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            maxLength={600}
            placeholder="e.g. Built an events pipeline handling 40k events/min"
            onKeyDown={(e) => e.key === "Enter" && addFact()}
          />
        </div>
        <Button variant="secondary" onClick={addFact} disabled={newText.trim().length < 3}>
          <Plus size={14} aria-hidden /> Add
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!approved ? (
          <Button onClick={approveRevision} disabled={busy || facts.length === 0}>
            <Check size={15} aria-hidden /> Confirm these facts
          </Button>
        ) : (
          <Button onClick={saveAsRevision} disabled={busy}>
            Save changes as new revision
          </Button>
        )}
        {saved ? (
          <p className="text-sm text-success" role="status">
            {saved}
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-text-disabled">
        Corrections create a new revision — history is preserved and older drafts keep the versions they used.
      </p>
    </div>
  );
}
