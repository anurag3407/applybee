"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select } from "@/components/ui/primitives";

export function SettingsForm(props: {
  displayName: string;
  timezone: string;
  careerStage: string;
  defaultMode: string;
  notifyReminders: boolean;
  notifyProduct: boolean;
  dailyDigestEnabled?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notifyReminders, setNotifyReminders] = useState(props.notifyReminders);
  const [notifyProduct, setNotifyProduct] = useState(props.notifyProduct);
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(props.dailyDigestEnabled ?? true);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    const form = new FormData(e.currentTarget);
    await fetch("/api/v1/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(form.get("displayName") ?? ""),
        timezone: String(form.get("timezone") ?? ""),
        careerStage: String(form.get("careerStage") ?? "") || undefined,
        defaultMode: String(form.get("defaultMode") ?? "manual"),
        notifyReminders,
        notifyProduct,
        dailyDigestEnabled,
      }),
    });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-border-decorative bg-surface p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" name="displayName" defaultValue={props.displayName} maxLength={120} />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={props.timezone} maxLength={60} placeholder="Asia/Kolkata" />
        </div>
        <div>
          <Label htmlFor="careerStage">Career stage</Label>
          <select id="careerStage" name="careerStage" defaultValue={props.careerStage} className="h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink">
            <option value="">Not set</option>
            <option value="student">Student / graduate</option>
            <option value="early_career">Early career</option>
            <option value="experienced">Experienced</option>
            <option value="career_switcher">Switching careers</option>
          </select>
        </div>
        <div>
          <Label htmlFor="defaultMode">Default writing mode</Label>
          <select id="defaultMode" name="defaultMode" defaultValue={props.defaultMode} className="h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink">
            <option value="manual">Manual</option>
            <option value="quick_ai">Quick AI</option>
            <option value="agentic">Agentic</option>
          </select>
        </div>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-ink">Notifications</legend>
        <label className="mt-2 flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" checked={dailyDigestEnabled} onChange={(e) => setDailyDigestEnabled(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>
            <strong className="text-ink">Daily 10-Post Hiring Digest</strong> (Free morning dispatch at 8:00 AM)
            <span className="block text-xs text-text-secondary">
              Receive 10 fresh founder & engineering hiring leads in your email every morning with 1-click tailored Gmail draft triggers.
            </span>
          </span>
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={notifyReminders} onChange={(e) => setNotifyReminders(e.target.checked)} className="h-4 w-4" />
          In-app opportunity reminders (always shown here; this also permits email reminders if introduced)
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={notifyProduct} onChange={(e) => setNotifyProduct(e.target.checked)} className="h-4 w-4" />
          Occasional product emails
        </label>
        <p className="mt-2 text-xs text-text-disabled">
          Transactional emails (receipts, security notices) are not controlled by these switches.
        </p>
      </fieldset>
      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </Button>
        {saved ? <p className="text-sm text-success" role="status">Saved.</p> : null}
      </div>
    </form>
  );
}
