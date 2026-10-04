import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getPreferences } from "@/server/services/resumes";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Profile settings" };

export default async function SettingsProfilePage() {
  const user = await requireActiveUser();
  const { user: u, prefs } = await getPreferences(user.id);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-ink">Profile settings</h2>
      <Card>
        <p className="text-sm text-text-secondary">Signed in as {u?.email}</p>
      </Card>
      <SettingsForm
        displayName={u?.displayName ?? ""}
        timezone={prefs?.timezone ?? "Asia/Kolkata"}
        careerStage={prefs?.careerStage ?? ""}
        defaultMode={prefs?.defaultMode ?? "manual"}
        notifyReminders={prefs?.notifyReminders ?? true}
        notifyProduct={prefs?.notifyProduct ?? false}
        dailyDigestEnabled={prefs?.dailyDigestEnabled ?? true}
      />
      <p className="text-xs text-text-disabled">
        Locale is English (India) at launch. Timezone affects reminder scheduling and display times.
      </p>
    </div>
  );
}

