"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type NavLink = { href: string; label: string; icon: React.ReactNode };

/** Mobile navigation sheet (§12.1): 56–64px header, native scroll. */
export function MobileNav({ links, bottomLinks, title }: { links: NavLink[]; bottomLinks: NavLink[]; title: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-20 border-b border-border-decorative bg-surface lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <button
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="app-nav-sheet"
          aria-label="Open navigation"
          className="rounded-control p-2 text-ink"
        >
          <Menu size={22} aria-hidden />
        </button>
        <p className="truncate text-sm font-bold text-ink">{title}</p>
        <Link href="/app/drafts/new" className="rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-surface">
          New draft
        </Link>
      </div>
      {open ? (
        <div className="fixed inset-0 z-30 bg-ink/40" onClick={() => setOpen(false)}>
          <nav
            id="app-nav-sheet"
            aria-label="Workspace"
            className="h-full w-72 overflow-y-auto border-r border-border-decorative bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Apply Bee</p>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-control p-1.5 text-ink">
                <X size={20} aria-hidden />
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
                "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold",
                active ? "bg-surface-subtle text-ink" : "text-text-secondary hover:bg-surface-subtle hover:text-ink",
              )}
            >
              <span aria-hidden className="text-text-secondary">
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
