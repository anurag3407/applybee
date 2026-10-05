"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowUpRight, Linkedin, Twitter, Github, Mail } from "lucide-react";
import Logo from "@/components/ui/hero-01-utils/logo";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};

export type HeaderProps = {
  navigationData: NavigationSection[];
  className?: string;
};

const HeaderCtaButton = ({ className }: { className?: string }) => (
  <Link href="/sign-up">
    <Button className={cn("relative text-sm font-medium rounded-full h-10 p-1 ps-5 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-5 w-fit overflow-hidden cursor-pointer bg-primary text-primary-foreground", className)}>
      <span className="relative z-10 transition-all duration-500">
        Start Free
      </span>
      <span className="absolute right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </span>
    </Button>
  </Link>
);

const Header = ({ navigationData, className }: HeaderProps) => {
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className={cn(
        "inset-x-0 z-50 px-4 flex items-center justify-center sticky top-0 h-20",
        className
      )}
    >
      <div
        className={cn(
          "w-full max-w-6xl flex items-center h-fit justify-between gap-3.5 lg:gap-6 transition-all duration-500",
          sticky
            ? "p-2.5 bg-background/80 backdrop-blur-lg border border-border/40 shadow-xl shadow-primary/5 rounded-full"
            : "bg-transparent border-transparent"
        )}
      >
        {/* Logo */}
        <div>
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div>
          <NavigationMenu className="max-lg:hidden bg-muted/70 p-1 rounded-full border border-border/50">
            <NavigationMenuList className="flex gap-1">
              {navigationData.map((navItem) => (
                <NavigationMenuItem key={navItem.title}>
                  <NavigationMenuLink
                    href={navItem.href}
                    className={cn(
                      "px-3 lg:px-4 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-background transition tracking-normal",
                      navItem.isActive ? "bg-background text-foreground shadow-xs" : ""
                    )}
                  >
                    {navItem.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop CTA */}
        <div className="flex gap-4 items-center">
          <HeaderCtaButton className="hidden lg:flex" />

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger" asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="rounded-full border border-border p-2 block hover:bg-muted transition"
                >
                  <Menu width={20} height={20} />
                  <span className="sr-only">Menu</span>
                </button>
              </SheetTrigger>

              <SheetContent
                showCloseButton={false}
                side="right"
                className="w-full sm:w-96 p-0 border-l border-border bg-background"
              >
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <Logo />
                  </Link>
                  <SheetClose id="mobile-menu-close" asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="rounded-full border border-border p-2 block hover:bg-muted transition"
                    >
                      <X width={16} height={16} />
                    </button>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-10 px-6 py-8 overflow-y-auto h-[calc(100%-80px)] justify-between">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <NavigationMenu
                      orientation="vertical"
                      className="items-start flex-none w-full"
                    >
                      <NavigationMenuList className="flex flex-col items-start gap-4 w-full">
                        {navigationData.map((item) => (
                          <NavigationMenuItem key={item.title} className="w-full">
                            <NavigationMenuLink
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "group/nav flex items-center text-xl font-semibold tracking-tight transition-all p-0 hover:bg-transparent focus:bg-transparent",
                                item.isActive
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-foreground hover:translate-x-2"
                              )}
                            >
                              <div
                                className={cn(
                                  "h-0.5 bg-primary transition-all duration-300 overflow-hidden",
                                  item.isActive
                                    ? "w-4 mr-2 opacity-100"
                                    : "w-0 opacity-0 group-hover/nav:w-4 group-hover/nav:mr-2 group-hover/nav:opacity-100"
                                )}
                              />
                              {item.title}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>

                    <div className="pt-2">
                      <HeaderCtaButton className="w-full justify-center" />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-border">
                    <div className="flex gap-3">
                      {[
                        { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                        { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                        { icon: Github, href: "https://github.com", label: "GitHub" },
                        { icon: Mail, href: "mailto:support@reachbee.io", label: "Email" },
                      ].map((social) => {
                        const IconComp = social.icon;
                        return (
                          <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={social.label}
                            className="flex items-center justify-center rounded-full border border-border hover:bg-muted transition p-2.5 shadow-xs text-muted-foreground hover:text-foreground"
                          >
                            <IconComp width={16} height={16} />
                          </a>
                        );
                      })}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      © {new Date().getFullYear()} ReachBee AI. All rights reserved.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
