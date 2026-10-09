"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea, InlineError, Badge } from "@/components/ui/primitives";
import { TEMPLATE_VARIABLES, findUnknownTemplateVariables, fillTemplate, type TemplateVariable } from "@/lib/validation";

/** Template editor with placeholder preview and unknown-variable warnings (§11.5). */
export function TemplateEditor({
  templateId,
  initial,
  sample,
}: {
  templateId: string | null;
  initial: { name: string; subject: string; body: string; version: number };
  sample: Partial<Record<TemplateVariable, string>>;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [version, setVersion] = useState(initial.version);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const unknown = findUnknownTemplateVariables(body, subject);
  const preview = fillTemplate(body, sample);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const url = templateId ? `/api/v1/templates?id=${templateId}` : "/api/v1/templates";
      const res = await fetch(url, {
        method: templateId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, body, ...(templateId ? { expectedVersion: version } : {}) }),
      });
      if (res.status === 409) {
        setError("This template changed elsewhere. Reload to compare.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Save failed.");
      }
      setSaved(true);
      if (!templateId) {
        const data = (await res.json()) as { data: { id: string } };
        router.push(`/app/templates/${data.data.id}`);
      }
      setVersion((v) => v + 1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <InlineError>{error}</InlineError> : null}
      {saved ? (
        <p className="rounded-control border border-success/30 bg-success-wash px-3 py-2 text-sm text-success" role="status">
          Saved.
        </p>
      ) : null}
      <div className="rounded-card border border-border-decorative bg-surface p-5">
        <Label htmlFor="tname">Name</Label>
        <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        <Label htmlFor="tsubject" className="mt-3">Subject</Label>
        <Input id="tsubject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
        <Label htmlFor="tbody" className="mt-3">Body</Label>
        <Textarea id="tbody" value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={20000} />
        <p className="mt-2 text-xs text-text-disabled">
          Placeholders: {TEMPLATE_VARIABLES.map((v) => `{{${v}}}`).join(", ")}
        </p>
        {unknown.length > 0 ? (
          <p className="mt-2 rounded-control bg-warning-wash px-3 py-2 text-sm text-warning" role="alert">
            Unknown placeholders will stay unfilled: {unknown.map((u) => `{{${u}}}`).join(", ")}
          </p>
        ) : null}
      </div>
      <div className="rounded-card border border-border-decorative bg-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink">Preview with sample data</h3>
          <Badge>Escaped output, no HTML</Badge>
        </div>
        <pre className="mt-2 whitespace-pre-wrap rounded-control border border-border-decorative bg-canvas p-3 text-sm text-ink">
          {preview.filled || "—"}
        </pre>
        {preview.missing.length > 0 ? (
          <p className="mt-2 text-xs text-warning">Unfilled: {preview.missing.join(", ")}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save template"}
        </Button>
      </div>
    </form>
  );
}
