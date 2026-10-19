"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconClose, IconMenu } from "@/components/svg/icons";
import { BrandMark } from "@/components/marketing/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";

export type NavLink = { href: string; label: string; icon: React.ReactNode };

/** Mobile navigation sheet (§12.1): 56–64px header, native scroll. */
export function MobileNav({ links, bottomLinks }: { links: NavLink[]; bottomLinks: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      menuRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-30 border-b border-border-decorative bg-surface lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <button
            ref={menuRef}
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="app-nav-sheet"
            aria-label="Open navigation"
            className="ab-press rounded-control p-2 text-ink hover:bg-surface-subtle"
          >
            <IconMenu size={22} />
          </button>
          <Link href="/app" className="flex items-center gap-2 rounded-control px-1 text-[0.9375rem] font-bold text-ink">
            <BrandMark size={20} />
            ReachBee
          </Link>
        </div>
        <Link
          href="/app/drafts/new"
          className="ab-press rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-surface"
        >
          New draft
        </Link>
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-veil"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            id="app-nav-sheet"
            aria-label="Workspace"
            role="dialog"
            aria-modal="true"
            className="h-full w-72 overflow-y-auto border-r border-border-decorative bg-surface p-4 shadow-overlay"
            style={{ animation: "ab-sheet-slide 260ms cubic-bezier(0.16,1,0.3,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-border-decorative pb-4">
              <Link href="/app" onClick={() => setOpen(false)} className="flex items-center gap-2 text-[0.9375rem] font-bold text-ink">
                <BrandMark size={22} />
                ReachBee
              </Link>
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="ab-press rounded-control p-1.5 text-ink hover:bg-surface-subtle"
              >
                <IconClose size={20} />
              </button>
            </div>
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold text-text-disabled">Workspace</p>
            <NavList links={links} onNavigate={() => setOpen(false)} />
            <div className="mt-5 border-t border-border-decorative pt-4">
              <p className="mb-2 px-3 text-[0.6875rem] font-semibold text-text-disabled">Account</p>
              <NavList links={bottomLinks} onNavigate={() => setOpen(false)} />
              <div className="mt-2 flex items-center justify-between px-3 pt-2">
                <span className="text-[0.8125rem] font-semibold text-text-secondary">Appearance</span>
                <ThemeToggle variant="pill" />
              </div>
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
    <ul className="space-y-0.5">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/app" && pathname.startsWith(l.href));
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "ab-press relative flex min-h-10 items-center gap-3 overflow-hidden rounded-control px-3 text-[0.8125rem] font-semibold",
                active
                  ? "bg-surface-subtle text-ink"
                  : "text-text-secondary hover:bg-surface-subtle/70 hover:text-ink",
              )}
            >
              {active ? (
                <span aria-hidden className="ab-rail absolute left-0 h-5 w-[2px] rounded-r-pill bg-honey" />
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
