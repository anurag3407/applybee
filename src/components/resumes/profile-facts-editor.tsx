"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconPlus, IconTrash } from "@/components/svg/icons";
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
  /**
   * Tracked as the *excluded* set, so a fact added after mount is selected by
   * default and a refresh that re-supplies `facts` cannot silently drop a choice
   * the user never made.
   */
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const isNew = (id: string) => id.startsWith("new-");
  const kept = facts.filter((f) => !excluded.has(f.id));
  const allApproved = facts.length > 0 && facts.every((f) => f.approved);

  async function submit(method: "PUT" | "POST", body: unknown, okMessage: string) {
    setBusy(true);
    setSaved(null);
    try {
      const res = await fetch("/api/v1/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // Checked, unlike before: reporting "confirmed" after a failed request left
      // the user believing their facts were usable in AI drafts when they were not.
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setSaved(data?.error?.message ?? "We couldn't confirm those facts. Please try again.");
        return;
      }
      setSaved(okMessage);
      setExcluded(new Set());
      router.refresh();
    } catch {
      setSaved("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Confirm what is selected.
   *
   * Typed-in additions are not in the database yet, so when any exist the whole
   * reviewed list is saved as a new revision — the old flow PUT the revision id
   * and silently discarded whatever the user had just added, then reported
   * success.
   */
  function confirmFacts() {
    const additions = facts.filter((f) => isNew(f.id));
    const payloadFacts = kept.map((f) => ({ factType: f.factType, text: f.text }));
    if (payloadFacts.length === 0) {
      setSaved("Keep at least one detail, AI drafting needs something confirmed to write from.");
      return;
    }
    if (additions.length > 0) {
      void submit(
        "POST",
        {
          ...(extracted?.targetRole ? { targetRole: extracted.targetRole } : {}),
          ...(extracted?.summary ? { summary: extracted.summary } : {}),
          facts: payloadFacts,
          approve: true,
        },
        "Confirmed. These details are now usable in AI drafts.",
      );
      return;
    }
    const subset = excluded.size > 0;
    void submit(
      "PUT",
      subset ? { revisionId, factIds: kept.map((f) => f.id) } : { revisionId },
      subset
        ? `Confirmed ${kept.length} of ${facts.length} details. The rest stay out of AI drafts.`
        : "Facts confirmed. They're now usable in AI drafts.",
    );
  }

  function saveAsRevision() {
    void submit(
      "POST",
      {
        ...(extracted?.targetRole ? { targetRole: extracted.targetRole } : {}),
        ...(extracted?.summary ? { summary: extracted.summary } : {}),
        facts: kept.map((f) => ({ factType: f.factType, text: f.text })),
        approve: true,
      },
      "Saved as a new revision.",
    );
  }

  function removeFact(id: string) {
    setFacts((fs) => fs.filter((f) => f.id !== id));
  }

  function toggleIncluded(id: string) {
    setExcluded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      {!approved ? (
        <p className="mt-3 text-xs leading-snug text-text-secondary">
          Uncheck anything that is not true for you. Only what you confirm here can be used to write a draft, you do
          not have to delete what you want to keep for later.
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {facts.map((f) => (
          <li key={f.id} className="flex items-start gap-2 rounded-control border border-border-decorative bg-canvas px-3 py-2">
            {!approved ? (
              <input
                type="checkbox"
                checked={!excluded.has(f.id)}
                onChange={() => toggleIncluded(f.id)}
                aria-label={`Use this detail in AI drafts: ${f.text.slice(0, 60)}`}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
            ) : null}
            <Badge tone={f.approved ? "success" : "warning"}>{f.factType}</Badge>
            <p className={`flex-1 text-sm ${excluded.has(f.id) ? "text-text-disabled line-through" : "text-ink"}`}>{f.text}</p>
            <button
              onClick={() => removeFact(f.id)}
              aria-label="Remove fact from this revision"
              className="rounded p-1 text-text-secondary hover:bg-surface-subtle hover:text-danger"
            >
              <IconTrash size={14} aria-hidden />
            </button>
          </li>
        ))}
        {facts.length === 0 ? <li className="text-sm text-text-secondary">No facts yet. Add a few below.</li> : null}
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
          <IconPlus size={14} aria-hidden /> Add
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!approved ? (
          <Button onClick={confirmFacts} disabled={busy || kept.length === 0}>
            <IconCheck size={15} aria-hidden />
            {excluded.size > 0 ? `Confirm ${kept.length} of ${facts.length} details` : "Confirm these facts"}
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
        Corrections create a new revision. History is preserved and older drafts keep the versions they used.
      </p>
    </div>
  );
}
