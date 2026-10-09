"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconClose, IconMenu } from "@/components/svg/icons";
import { cn } from "@/lib/cn";

export type NavLink = { href: string; label: string; icon: React.ReactNode };

/** Mobile navigation sheet (§12.1): 56–64px header, native scroll. */
export function MobileNav({ links, bottomLinks, title }: { links: NavLink[]; bottomLinks: NavLink[]; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-20 border-b border-border-decorative bg-surface lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <button
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="app-nav-sheet"
          aria-label="Open navigation"
          className="ab-press rounded-control p-2 text-ink hover:bg-surface-subtle"
        >
          <IconMenu size={22} />
        </button>
        <p className="truncate text-sm font-bold text-ink">{title}</p>
        <Link
          href="/app/drafts/new"
          className="ab-press rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-surface"
        >
          New draft
        </Link>
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-veil backdrop:backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        >
          <nav
            id="app-nav-sheet"
            aria-label="Workspace"
            className="h-full w-72 overflow-y-auto border-r border-border-decorative bg-surface p-4 shadow-overlay"
            style={{ animation: "ab-sheet-slide 260ms cubic-bezier(0.16,1,0.3,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">ReachBee</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="ab-press rounded-control p-1.5 text-ink hover:bg-surface-subtle"
              >
                <IconClose size={20} />
              </button>
            </div>
            <NavList links={links} onNavigate={() => setOpen(false)} />
            <div className="mt-6 border-t border-border-decorative pt-4">
              <NavList links={bottomLinks} onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

export function NavList({ links, onNavigate }: { links: NavLink[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/app" && pathname.startsWith(l.href));
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "ab-press relative flex min-h-11 items-center gap-3 overflow-hidden rounded-control px-3 text-sm font-semibold",
                active
                  ? "bg-surface-subtle text-ink"
                  : "text-text-secondary hover:bg-surface-subtle/70 hover:text-ink",
              )}
            >
              {active ? (
                <span aria-hidden className="ab-rail absolute left-0 h-6 w-[3px] rounded-r-pill bg-honey" />
              ) : null}
              <span aria-hidden className={cn("transition-colors", active ? "text-honey-deep" : "text-text-secondary")}>
                {l.icon}
              </span>
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
