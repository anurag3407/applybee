"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/base-ui/navigation-menu";
import { Button } from "@/components/base-ui/button";
import { Badge } from "@/components/base-ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/base-ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/base-ui/accordion";
import { BrandMark } from "@/components/marketing/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Cpu,
  Layers,
  GitBranch,
  Terminal,
  Command,
  User,
  Menu,
  ArrowUpRight,
} from "lucide-react";

export interface Navigation5Props {
  signedIn?: boolean;
  className?: string;
}

export function Navigation5({ signedIn = false, className }: Navigation5Props) {
  return (
    <div className={cn("relative w-full py-6 md:py-8", className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6">
        {/* Floating Navbar Pill */}
        <div className="flex h-16 w-full max-w-5xl items-center justify-between gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 shadow-sm backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-neutral-950/90">
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-2.5 pl-3 pr-4 transition-opacity hover:opacity-90"
          >
            <BrandMark size={26} />
            <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              ReachBee
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavigationMenu
              className={cn(
                "static",
                // Position the viewport wrapper to be full-width relative to the navbar container
                "[&>div:last-child]:inset-x-0 [&>div:last-child]:top-full [&>div:last-child]:w-full",
                // Custom viewport styling for the 'island' look
                "[&_[data-slot=navigation-menu-viewport]]:mx-auto [&_[data-slot=navigation-menu-viewport]]:-mt-6 [&_[data-slot=navigation-menu-viewport]]:max-w-7xl [&_[data-slot=navigation-menu-viewport]]:ring-0",
                "[&_[data-slot=navigation-menu-viewport]]:rounded-[2.5rem] [&_[data-slot=navigation-menu-viewport]]:border [&_[data-slot=navigation-menu-viewport]]:border-neutral-200 dark:[&_[data-slot=navigation-menu-viewport]]:border-neutral-800",
                "[&_[data-slot=navigation-menu-viewport]]:bg-white [&_[data-slot=navigation-menu-viewport]]:shadow-2xl dark:[&_[data-slot=navigation-menu-viewport]]:bg-neutral-950",
                // Viewport smooth animations
                "[&_[data-slot=navigation-menu-viewport]]:transition-all [&_[data-slot=navigation-menu-viewport]]:duration-300 [&_[data-slot=navigation-menu-viewport]]:ease-in-out",
                "[&_[data-slot=navigation-menu-viewport]]:data-open:fade-in-0 [&_[data-slot=navigation-menu-viewport]]:data-closed:fade-out-0",
                "[&_[data-slot=navigation-menu-viewport]]:data-open:zoom-in-100 [&_[data-slot=navigation-menu-viewport]]:data-closed:zoom-out-100"
              )}
            >
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="rounded-full bg-transparent px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    href="/#features"
                  >
                    Features
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="rounded-full bg-transparent px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    href="/#how-it-works"
                  >
                    How it works
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto rounded-full bg-transparent px-3.5 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100/50 hover:text-neutral-900 focus:bg-transparent data-[state=open]:bg-neutral-100/80 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50 dark:data-[state=open]:bg-neutral-800/80">
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="p-0">
                    <div className="grid w-5xl grid-cols-4 gap-6 divide-x divide-neutral-100 px-10 py-10 dark:divide-neutral-900">
                      {/* Column 1: Outreach Engine */}
                      <div className="flex flex-col px-2">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900">
                          <Cpu className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          Outreach Engine
                        </h4>
                        <p className="mb-3 text-sm tracking-tight text-neutral-500 dark:text-neutral-400">
                          Direct introductions, verified emails, and anti-hallucination drafts.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="h-7 gap-1.5 rounded-full px-3 text-xs text-neutral-700 dark:text-neutral-300"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            AI Drafts
                          </Button>
                          <Button
                            variant="outline"
                            className="h-7 gap-1.5 rounded-full px-3 text-xs text-neutral-700 dark:text-neutral-300"
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                            Verification
                          </Button>
                          <Button
                            variant="outline"
                            className="h-7 gap-1.5 rounded-full px-3 text-xs text-neutral-700 dark:text-neutral-300"
                          >
                            <Terminal className="h-3.5 w-3.5" />
                            Pipeline
                          </Button>
                        </div>
                      </div>

                      {/* Column 2: Use Cases */}
                      <div className="flex flex-col gap-3 pl-6">
                        <h4 className="mb-1 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                          Use Cases
                        </h4>
                        <Link
                          href="/#features"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Career Outreach
                        </Link>
                        <Link
                          href="/#features"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Executive Networking
                        </Link>
                        <Link
                          href="/#features"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Investor Introductions
                        </Link>
                        <Link
                          href="/#features"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Founder Partnerships
                        </Link>
                      </div>

                      {/* Column 3: Resources */}
                      <div className="flex flex-col gap-3 pl-6">
                        <h4 className="mb-1 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                          Resources
                        </h4>
                        <Link
                          href="/#how-it-works"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          How It Works
                        </Link>
                        <Link
                          href="/pricing"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Pricing Plans
                        </Link>
                        <Link
                          href="/#trust"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Trust & Privacy
                        </Link>
                        <Link
                          href="/faq"
                          className="text-sm font-medium tracking-tight text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          System FAQ
                        </Link>
                      </div>

                      {/* Column 4: Featured */}
                      <div className="flex flex-col pl-6">
                        <h4 className="mb-4 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                          Featured
                        </h4>
                        <Link
                          href="/#features"
                          className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 ring-1 ring-neutral-200 transition-all hover:ring-primary/50 dark:ring-neutral-800"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent group-hover:opacity-100" />
                          <div className="absolute inset-0 -z-10 bg-neutral-100/70 dark:bg-neutral-900/70" />

                          <div>
                            <Badge
                              variant="outline"
                              className="mb-3 border-amber-500/40 bg-white text-amber-600 dark:bg-neutral-950 dark:text-amber-400"
                            >
                              Anti-Hallucination
                            </Badge>
                            <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                              Resume Fact Verification
                            </h4>
                            <p className="text-sm tracking-tight text-neutral-600 dark:text-neutral-400">
                              Every claim is checked against your uploaded profile facts before drafts reach your hands.
                            </p>
                          </div>

                          <div className="mt-4 flex items-center text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Explore features{" "}
                            <ArrowUpRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="rounded-full bg-transparent px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    href="/pricing"
                  >
                    Pricing
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="rounded-full bg-transparent px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    href="/#trust"
                  >
                    Trust
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Action Icons Section — Tailored to Website Buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 md:flex">
              <ThemeToggle className="h-9 w-9 rounded-full border-neutral-200/80 bg-neutral-100/50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800" />
              <Link href="/app/saved">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  aria-label="Quick bookmarks and shortcuts"
                >
                  <Command className="size-4" />
                </Button>
              </Link>
            </div>

            {signedIn ? (
              <Link href="/app">
                <Button className="hidden rounded-full bg-ink px-6 font-semibold text-surface shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] md:block dark:bg-white dark:text-neutral-950">
                  Open workspace
                </Button>
              </Link>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="rounded-full px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-full bg-ink px-6 font-semibold text-surface shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-neutral-950">
                    Start free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <div className="flex items-center gap-1 lg:hidden">
              <ThemeToggle className="h-8.5 w-8.5 rounded-full border-neutral-200/80 bg-neutral-100/50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800" />
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-neutral-700 dark:text-neutral-300"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex w-[320px] flex-col gap-6 p-6 dark:bg-neutral-950"
                >
                  <div className="flex items-center gap-2.5">
                    <BrandMark size={26} />
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">
                      ReachBee
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Link
                      href="/#features"
                      className="text-base font-medium text-neutral-900 transition-colors hover:text-primary dark:text-neutral-50"
                    >
                      Features
                    </Link>
                    <Link
                      href="/#how-it-works"
                      className="text-base font-medium text-neutral-900 transition-colors hover:text-primary dark:text-neutral-50"
                    >
                      How it works
                    </Link>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="solutions" className="border-none">
                        <AccordionTrigger className="justify-between py-0 text-base font-medium text-neutral-900 hover:no-underline dark:text-neutral-50">
                          Solutions
                        </AccordionTrigger>
                        <AccordionContent className="mt-1 ml-2 flex !h-auto flex-col gap-3 border-l border-neutral-200 pb-0 pl-4 text-base font-medium dark:border-neutral-800 [&_a]:no-underline">
                          <div className="flex flex-col gap-2 pt-4">
                            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                              Core Engine
                            </span>
                            <Link
                              href="/#features"
                              className="text-sm font-medium tracking-tight text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                            >
                              AI Tailored Introductions
                            </Link>
                            <Link
                              href="/#features"
                              className="text-sm font-medium tracking-tight text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                            >
                              Direct Verified Emails
                            </Link>
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                              Use Cases
                            </span>
                            <Link
                              href="/#features"
                              className="text-sm font-medium tracking-tight text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                            >
                              Career Outreach
                            </Link>
                            <Link
                              href="/#features"
                              className="text-sm font-medium tracking-tight text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                            >
                              Executive Networking
                            </Link>
                            <Link
                              href="/#features"
                              className="text-sm font-medium tracking-tight text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
                            >
                              Founder / Investor Introductions
                            </Link>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Link
                      href="/pricing"
                      className="text-base font-medium text-neutral-900 transition-colors hover:text-primary dark:text-neutral-50"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/#trust"
                      className="text-base font-medium text-neutral-900 transition-colors hover:text-primary dark:text-neutral-50"
                    >
                      Trust & Privacy
                    </Link>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    {signedIn ? (
                      <Link href="/app" className="w-full">
                        <Button className="w-full rounded-full bg-ink text-surface dark:bg-white dark:text-neutral-950">
                          Open workspace
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/sign-in" className="w-full">
                          <Button variant="outline" className="w-full rounded-full">
                            Sign in
                          </Button>
                        </Link>
                        <Link href="/sign-up" className="w-full">
                          <Button className="w-full rounded-full bg-ink text-surface dark:bg-white dark:text-neutral-950">
                            Start free
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navigation5;
