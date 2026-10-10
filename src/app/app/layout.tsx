import { AppShell } from "@/components/shell/app-shell";
import { requireActiveUser } from "@/server/auth/session";
import type { Metadata } from "next";
import { noIndexMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = noIndexMeta;

/**
 * Guard in the layout as well as inside AppShell. AppShell renders within the
 * page tree, so this runs first and rejects a disabled or anonymous request
 * before any workspace page body is rendered.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireActiveUser();
  return (
    <AppShell title="Workspace">
      {children}
    </AppShell>
  );
}