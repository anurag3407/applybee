import { requireAdmin } from "@/server/auth/session";
import type { Metadata } from "next";
import { noIndexMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = noIndexMeta;

/**
 * Admin authorization lives here, not only in each page.
 *
 * `AdminShell` also calls requireAdmin(), but it renders *inside* the page:
 * the page component runs its cross-user queries (all payments, all emails,
 * the audit log) before the shell's guard executes. Guarding in the layout
 * means a non-admin request is rejected before any admin page body renders,
 * and it protects any admin page added later that forgets to guard itself.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}