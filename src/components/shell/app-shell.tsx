import Link from "next/link";
import {
  IconBell,
  IconCompose,
  IconControls,
  IconDraft,
  IconExit,
  IconFlow,
  IconLifeRing,
  IconPocket,
  IconPerson,
  IconRadar,
  IconStencil,
  IconToken,
  IconTrail,
  IconComb,
  IconChevronDown,
} from "@/components/svg/icons";
import { requireActiveUser } from "@/server/auth/session";
import { getBalances } from "@/server/services/credits";
import { unreadCount } from "@/server/services/opportunities";
import { BrandMark } from "@/components/marketing/brand";
import { NavList, MobileNav, type NavLink } from "@/components/shell/mobile-nav";
import { CreditStrip } from "@/components/shell/credit-strip";
import { SignOutButton } from "@/components/shell/sign-out";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageEnter } from "@/components/motion";
import { cn } from "@/lib/cn";

/**
 * Application shell (§12.1): 240px sidebar, credit strip with independently
 * named balances, utility header, notifications only because a real
 * notification system exists.
 */
const links: NavLink[] = [
  { href: "/app", label: "Overview", icon: <IconComb size={18} /> },
  { href: "/app/contacts", label: "Find contacts", icon: <IconRadar size={18} /> },
  { href: "/app/saved", label: "Saved", icon: <IconPocket size={18} /> },
  { href: "/app/drafts", label: "Drafts", icon: <IconDraft size={18} /> },
  { href: "/app/templates", label: "Templates", icon: <IconStencil size={18} /> },
  { href: "/app/profile", label: "Career profile", icon: <IconPerson size={18} /> },
  { href: "/app/pipeline", label: "Pipeline", icon: <IconFlow size={18} /> },
  { href: "/app/activity", label: "Activity", icon: <IconTrail size={18} /> },
];

const bottomLinks: NavLink[] = [
  { href: "/app/billing", label: "Billing", icon: <IconToken size={18} /> },
  { href: "/app/settings", label: "Settings", icon: <IconControls size={18} /> },
  { href: "/help", label: "Help", icon: <IconLifeRing size={18} /> },
];

export async function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const user = await requireActiveUser();
  const balances = await getBalances(user.id);
  const unread = await unreadCount(user.id);

  return (
    <div className="min-h-screen bg-canvas">
      <MobileNav links={links} bottomLinks={bottomLinks} title={title} />
      <div className="mx-auto flex max-w-[calc(var(--ab-container-app))]">
        <aside className="sticky top-0 hidden h-screen w-[15rem] shrink-0 flex-col border-r border-border-decorative bg-surface px-4 py-5 lg:flex">
          <Link
            href="/app"
            className="ab-mark ab-press mb-6 flex items-center gap-2 rounded-control px-1 font-bold text-ink"
          >
            <BrandMark size={24} />
            ReachBee
          </Link>

          <nav aria-label="Workspace" className="flex-1 overflow-y-auto">
            <p className="mb-2 px-3 text-xs font-bold text-text-disabled">Workspace</p>
            <NavList links={links} />
          </nav>

          <CreditStrip contact={balances.contact} ai={balances.ai} />
          <div className="mt-4 border-t border-border-decorative pt-4">
            <p className="mb-2 px-3 text-xs font-bold text-text-disabled">Account</p>
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
            <PageEnter key={title}>{children}</PageEnter>
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
      <h1 className="text-base font-bold tracking-tight text-ink">{title}</h1>
      <div className="flex items-center gap-2.5">
        <Link
          href="/app/drafts/new"
          className="ab-press flex min-h-9 items-center gap-2 rounded-control bg-ink px-3.5 text-sm font-semibold text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-ink-soft"
        >
          <IconCompose size={15} />
          Create an introduction
        </Link>
        <ThemeToggle />
        <Link
          href="/app/notifications"
          className={cn(
            "ab-press relative rounded-control p-2 text-text-secondary hover:bg-surface-subtle hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          )}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <IconBell size={19} />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-honey px-1 text-[10px] font-bold text-on-honey ring-2 ring-surface"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="ab-press rounded-control border border-border-control px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-surface-subtle"
          >
            Admin
          </Link>
        ) : null}
        <details className="group relative">
          <summary className="ab-press flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-control border border-border-decorative px-3 text-sm font-semibold text-ink marker:hidden hover:bg-surface-subtle">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-honey-wash text-xs font-bold text-ink">
              {(displayName ?? email)[0]?.toUpperCase()}
            </span>
            <span className="hidden max-w-[10rem] truncate xl:inline">{displayName ?? email}</span>
            <IconChevronDown size={14} className="opacity-60 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-60 origin-top-right rounded-card border border-border-decorative bg-surface p-2 shadow-float">
            <p className="truncate px-3 py-1.5 text-xs text-text-disabled">{email}</p>
            <MenuLink href="/app/settings/profile">Profile settings</MenuLink>
            <MenuLink href="/app/billing">Billing</MenuLink>
            <div className="my-1.5 border-t border-border-decorative" />
            <SignOutButton />
          </div>
        </details>
      </div>
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="ab-press block rounded-control px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-subtle"
    >
      {children}
    </Link>
  );
}
