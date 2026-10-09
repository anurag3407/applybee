"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Textarea } from "@/components/ui/primitives";
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
    const firstFact = String(form.get("firstFact") ?? "").trim();
    if (firstFact.length < 12) {
      setError("Add one true sentence about your work — AI drafts are written only from details you confirm.");
      setBusy(false);
      return;
    }
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
      //
      // Every fact below is something the user typed on this screen. The version
      // before pushed a career-stage sentence ("Early-career software engineer
      // ready to contribute") as an `experience` fact with approve:true, so every
      // draft was grounded in a sentence nobody had confirmed.
      const starterFacts: Array<{ factType: "achievement" | "skill"; text: string }> = [
        { factType: "achievement", text: firstFact },
      ];
      if (targetRole.trim()) {
        starterFacts.push({
          factType: "skill",
          text: `Target career role: ${targetRole.trim()}`,
        });
      }

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
          <div className="md:col-span-2">
            <Label htmlFor="firstFact">One true thing about your work</Label>
            <Textarea
              id="firstFact"
              name="firstFact"
              rows={3}
              required
              maxLength={600}
              placeholder="I cut p99 latency 40% on a payments service at my last job."
              className="font-[inherit]"
            />
            <p className="mt-1 text-xs leading-snug text-text-secondary">
              AI drafts are written only from details like this one. Add more, or upload a resume, in the next step.
            </p>
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
        <Link href="/onboarding/complete">
          <Button>Continue</Button>
        </Link>
      </div>
    </div>
  );
}

/*
 * Done. Gmail is no longer a step here: its permission explanation and connect
 * flow live in Settings → Integrations, and it is asked for at the first delivery
 * where its value is obvious — not before the user has ever drafted anything.
 */
export function CompleteStep({ contactCredits, aiCredits }: { contactCredits: number; aiCredits: number }) {
  const router = useRouter();

  /**
   * `onboarding_step` is bookkeeping read only by the `/onboarding` resolver, so a
   * failed write must not trap anyone on this screen — they are sent onward either
   * way. It used to be written by the page's own render, i.e. from a GET, where a
   * prefetch alone mutated the row.
   */
  async function finish(path: string) {
    try {
      await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "complete" }),
      });
    } catch {
      // Bookkeeping only; navigation below does not depend on it.
    }
    router.push(path);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-border-decorative bg-surface p-6">
        <h2 className="text-xl font-bold text-ink">You’re set up.</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your current balances, straight from your account (not a marketing promise):
        </p>
        <ul className="mt-3 space-y-1 text-sm text-ink">
          <li>
            • {contactCredits} contact {contactCredits === 1 ? "reveal" : "reveals"}
          </li>
          <li>
            • {aiCredits} AI {aiCredits === 1 ? "generation" : "generations"}
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => void finish("/app/contacts")}>Find contacts &amp; start outreach</Button>
          <Button variant="secondary" onClick={() => void finish("/app")}>
            Go to dashboard
          </Button>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-text-secondary">
        Gmail is optional and comes up when you first want a draft in your mailbox. Writing, AI drafts, copying and
        .eml export all work without it.
      </p>
    </div>
  );
}
