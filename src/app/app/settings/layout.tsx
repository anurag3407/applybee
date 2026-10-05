import type { Metadata } from "next";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-text-secondary">
          Manage your account preferences, connected integrations, notification triggers, and data privacy.
        </p>
      </div>
      <SettingsNav />
      <div>{children}</div>
    </div>
  );
}
