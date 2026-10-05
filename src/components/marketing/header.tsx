"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./brand";
import { Button } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";

/**
 * Sticky 64–72 px header; translucent-to-solid on scroll, but legibility never
 * depends on backdrop filtering (§10.1). Signed-in CTA becomes Open workspace.
 */
export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#features", label: "Features" },
    { href: "/#trust", label: "Trust" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-16 border-b transition-colors",
        solid ? "border-border-decorative bg-surface/95" : "border-transparent bg-canvas/80",
      )}
    >
      <div className="mx-auto flex h-full max-w-[calc(var(--ab-container-marketing))] items-center justify-between px-5">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-semibold text-text-secondary hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/app">
              <Button variant="primary">Open workspace</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="secondary">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="accent">Start free</Button>
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-control p-2 text-ink"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div id="mobile-menu" className="border-b border-border-decorative bg-surface px-5 py-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-semibold text-ink" onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {signedIn ? (
                <Link href="/app" className="flex-1">
                  <Button className="w-full" variant="primary">
                    Open workspace
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="flex-1">
                    <Button className="w-full" variant="secondary">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="flex-1">
                    <Button className="w-full" variant="accent">
                      Start free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
