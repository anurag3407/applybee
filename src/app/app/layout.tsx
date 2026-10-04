import { AppShell } from "@/components/shell/app-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Workspace">
      {children}
    </AppShell>
  );
}
