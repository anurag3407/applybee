import Link from "next/link";
import {
  LayoutDashboard, Search, Bookmark, FileText, LayoutTemplate, UserRound, KanbanSquare,
  CreditCard, Settings, CircleHelp, Bell, LogOut, PenLine,
} from "lucide-react";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { unreadCount } from "@/server/services/opportunities";
import { BrandMark } from "@/components/marketing/brand";
import { NavList, MobileNav } from "@/components/shell/mobile-nav";
import { CreditStrip } from "@/components/shell/credit-strip";
import { SignOutButton } from "@/components/shell/sign-out";
import { cn } from "@/lib/cn";

/**
 * Application shell (§12.1): 240px sidebar, credit strip with independently
 * named balances, utility header, notifications only because a real
 * notification system exists.
 */
export async function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const user = await requireActiveUser();
  const balances = await getBalances(user.id);
  const unread = await unreadCount(user.id);

  const links = [
    { href: "/app", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { href: "/app/contacts", label: "Find contacts", icon: <Search size={18} /> },
    { href: "/app/saved", label: "Saved", icon: <Bookmark size={18} /> },
    { href: "/app/drafts", label: "Drafts", icon: <FileText size={18} /> },
    { href: "/app/templates", label: "Templates", icon: <LayoutTemplate size={18} /> },
    { href: "/app/profile", label: "Career profile", icon: <UserRound size={18} /> },
    { href: "/app/pipeline", label: "Pipeline", icon: <KanbanSquare size={18} /> },
  ];
  const bottomLinks = [
    { href: "/app/billing", label: "Billing", icon: <CreditCard size={18} /> },
    { href: "/app/settings", label: "Settings", icon: <Settings size={18} /> },
    { href: "/help", label: "Help", icon: <CircleHelp size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <MobileNav links={links} bottomLinks={bottomLinks} title={title} />
      <div className="mx-auto flex max-w-[calc(var(--ab-container-app))]">
        <aside className="sticky top-0 hidden h-screen w-[15rem] shrink-0 flex-col border-r border-border-decorative bg-surface px-4 py-5 lg:flex">
          <Link href="/app" className="mb-6 flex items-center gap-2 font-bold text-ink">
            <BrandMark size={24} />
            Apply Bee
          </Link>
          <nav aria-label="Workspace" className="flex-1 overflow-y-auto">
            <NavList links={links} />
          </nav>
          <CreditStrip contact={balances.contact} ai={balances.ai} />
          <div className="mt-4 border-t border-border-decorative pt-4">
            <NavList links={bottomLinks} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <AppHeader
            title={title}
            displayName={user.displayName}
            email={user.email}
            isAdmin={user.isAdmin}
            unread={unread}
          />
          <main id="main" className="px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function AppHeader({
  title,
  displayName,
  email,
  isAdmin,
  unread,
}: {
  title: string;
  displayName: string | null;
  email: string;
  isAdmin: boolean;
  unread: number;
}) {
  return (
    <header className="hidden h-16 items-center justify-between border-b border-border-decorative bg-surface px-8 lg:flex">
      <h1 className="text-base font-bold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <Link href="/app/drafts/new" className="flex min-h-9 items-center gap-2 rounded-control bg-ink px-3.5 text-sm font-semibold text-surface hover:bg-ink-soft">
          <PenLine size={15} aria-hidden />
          Create an introduction
        </Link>
        <Link href="/app/notifications" className="relative rounded-control p-2 text-text-secondary hover:bg-surface-subtle hover:text-ink" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell size={19} aria-hidden />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-honey px-1 text-[10px] font-bold text-ink">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
        {isAdmin ? (
          <Link href="/admin" className="rounded-control border border-border-control px-2.5 py-1.5 text-xs font-bold text-ink">
            Admin
          </Link>
        ) : null}
        <details className="group relative">
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-control border border-border-decorative px-3 text-sm font-semibold text-ink marker:hidden">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-honey-wash text-xs font-bold">
              {(displayName ?? email)[0]?.toUpperCase()}
            </span>
            <span className="hidden max-w-[10rem] truncate xl:inline">{displayName ?? email}</span>
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-card border border-border-decorative bg-surface p-2 shadow-float">
            <p className="truncate px-3 py-1.5 text-xs text-text-disabled">{email}</p>
            <Link href="/app/settings/profile" className="block rounded-control px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-subtle">
              Profile settings
            </Link>
            <Link href="/app/billing" className="block rounded-control px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-subtle">
              Billing
            </Link>
            <SignOutButton />
          </div>
        </details>
      </div>
    </header>
  );
}

export { cn };
