import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { BrandMark } from "@/components/marketing/brand";
import { SignOutButton } from "@/components/shell/sign-out";
import { PageEnter } from "@/components/motion";

const ADMIN_NAV = [
  { href: "/admin", label: "Health" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit-log", label: "Audit log" },
  { href: "/admin/config", label: "Config" },
];

/** Admin shell (§11.7): explicit label, server-validated access on every page. */
export async function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="brand-panel border-b border-border-decorative bg-ink">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <BrandMark size={22} className="text-surface" />
            <span className="font-bold text-surface">Admin workspace</span>
            <span className="rounded-pill bg-honey px-2 py-0.5 text-xs font-bold text-on-honey">Operator</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/app" className="font-semibold text-white/80 hover:text-surface">
              User workspace
            </Link>
            <span className="text-white/60">{admin.email}</span>
            <div className="[&_button]:text-white/80 [&_button]:hover:text-surface">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <nav aria-label="Admin" className="sticky top-0 hidden h-screen w-48 shrink-0 flex-col gap-1 border-r border-border-decorative bg-surface p-3 md:flex">
          {ADMIN_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="ab-press flex min-h-10 items-center rounded-control px-3 text-sm font-semibold text-text-secondary hover:bg-surface-subtle hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
          <PageEnter>
            <h1 className="mb-5 text-xl font-bold text-ink">{title}</h1>
            {children}
          </PageEnter>
        </main>
      </div>
    </div>
  );
}
