"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Textarea, Badge } from "@/components/ui/primitives";
import { UploadZone } from "@/components/resumes/upload-zone";

/* Profile step: name, target role, career stage, preferred location. */
export function ProfileStep() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const targetRole = String(form.get("targetRole") ?? "");
    const careerStage = String(form.get("careerStage") ?? "early_career");
    try {
      const prefsRes = await fetch("/api/v1/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: String(form.get("displayName") ?? ""),
          targetRoles: targetRole.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5),
          targetLocations: String(form.get("location") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 5),
          careerStage,
        }),
      });
      if (!prefsRes.ok) throw new Error("preferences");

      // The revision endpoint is POST /api/v1/profile. This previously posted
      // to /api/v1/profile/revisions, which does not exist — the 404 was never
      // checked, so no profile revision was created and the user went on to a
      // workspace where every AI generation failed with NO_CONFIRMED_FACTS.
      const starterFacts: Array<{ factType: "skill" | "experience" | "summary"; text: string }> = [];
      if (targetRole.trim()) {
        starterFacts.push({
          factType: "skill",
          text: `Target career role: ${targetRole.trim()}`,
        });
      }
      const stageMap: Record<string, string> = {
        student: "Student / recent graduate actively seeking engineering roles",
        early_career: "Early-career software engineer ready to contribute",
        experienced: "Experienced engineer with professional industry background",
        career_switcher: "Career switcher with transferable technical skills",
      };
      starterFacts.push({
        factType: "experience",
        text: stageMap[careerStage] ?? "Software engineering candidate",
      });

      const profileRes = await fetch("/api/v1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          careerStage,
          facts: starterFacts,
          approve: true,
        }),
      });
      if (!profileRes.ok) throw new Error("profile");

      router.push("/onboarding/resume");
      router.refresh();
    } catch {
      setError("Saving failed. Please try again — your details were not saved.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <div className="rounded-card border border-border-decorative bg-surface p-6">
        <h2 className="text-xl font-bold text-ink">Tell us the essentials</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Only what’s needed for relevant drafts. You can change everything later.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="displayName">Your name</Label>
            <Input id="displayName" name="displayName" autoComplete="name" required maxLength={120} />
          </div>
          <div>
            <Label htmlFor="careerStage">Career stage</Label>
            <select id="careerStage" name="careerStage" className="h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink" defaultValue="early_career">
              <option value="student">Student / graduate</option>
              <option value="early_career">Early career</option>
              <option value="experienced">Experienced</option>
              <option value="career_switcher">Switching careers</option>
            </select>
          </div>
          <div>
            <Label htmlFor="targetRole">Target roles (comma-separated)</Label>
            <Input id="targetRole" name="targetRole" placeholder="Frontend engineer, Platform engineer" />
          </div>
          <div>
            <Label htmlFor="location">Preferred locations</Label>
            <Input id="location" name="location" placeholder="Bengaluru, Remote" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
      </div>
    </form>
  );
}

/* Resume step: upload or skip; review happens in the workspace. */
export function ResumeStep() {
  const [done, setDone] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-card border border-border-decorative bg-surface p-6">
        <h2 className="text-xl font-bold text-ink">Add your resume (optional)</h2>
        <p className="mt-1 text-sm text-text-secondary">
          PDF up to 5 MiB. We parse it into a draft profile that you review and confirm — nothing is trusted
          automatically. You can also type facts manually later.
        </p>
        <div className="mt-5">
          <UploadZone onDone={() => setDone(true)} />
        </div>
        {done ? (
          <p className="mt-3 text-sm text-success" role="status">
            Uploaded — we’ll parse it and you can review the extracted facts in your Career profile.
          </p>
        ) : null}
      </div>
      <div className="flex justify-between">
        <Link href="/app">
          <Button variant="ghost">Skip for now</Button>
        </Link>
        <Link href="/onboarding/gmail">
          <Button>Continue</Button>
        </Link>
      </div>
    </div>
  );
}

/* Gmail step: accurate permission explanation, connect or later. */
export function GmailStep() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/gmail/connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnPath: "/onboarding/complete" }) });
      const body = (await res.json()) as { data?: { authorizeUrl?: string }; error?: { message?: string } };
      if (body.data?.authorizeUrl) {
        window.location.href = body.data.authorizeUrl;
        return;
      }
      setError(body.error?.message ?? "Gmail connection isn’t available in this environment. You can continue without it.");
      setBusy(false);
    } catch {
      setError("Gmail connection isn’t available right now. You can continue without it.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-border-decorative bg-surface p-6">
        <h2 className="text-xl font-bold text-ink">Connect Gmail — optional</h2>
        <div className="mt-3 rounded-control border border-info/30 bg-info-wash px-4 py-3 text-sm leading-relaxed text-ink">
          <p>
            “Google’s permission allows managing drafts and sending email. ReachBee uses this connection to create
            drafts you approve. We do not send email automatically or read your inbox. You can disconnect at any time.”
          </p>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Everything in ReachBee works without Gmail: writing, AI drafts, copying, and export. Connecting only adds
          draft creation inside your mailbox. Connecting is separate from signing in.
        </p>
        {error ? (
          <p className="mt-3 rounded-control border border-warning/30 bg-warning-wash px-3 py-2 text-sm text-warning" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" onClick={connect} disabled={busy}>
            {busy ? "Redirecting…" : "Connect Gmail"}
          </Button>
          <Link href="/onboarding/complete">
            <Button variant="secondary">Maybe later</Button>
          </Link>
        </div>
      </div>
      <div className="flex justify-end">
        <Badge tone="info">Separate OAuth project from sign-in</Badge>
      </div>
    </div>
  );
}

/* Preferences step folded into the dashboard; complete page shows balances. */
export function PreferencesStep() {
  return null;
}
