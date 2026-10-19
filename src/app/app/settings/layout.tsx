import type { Metadata } from "next";
import { SettingsNav } from "@/components/settings/settings-nav";
import { AppPageHeader } from "@/components/shell/app-page-header";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <AppPageHeader
        title="Settings"
        lede="Manage your account preferences, connected integrations, notification triggers, and data privacy."
      />
      <SettingsNav />
      <div>{children}</div>
    </div>
  );
}
