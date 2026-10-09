"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell, IconKey, IconLock, IconPerson, IconShield
} from "@/components/svg/icons";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/app/settings/profile", label: "Profile", icon: IconPerson },
  { href: "/app/settings/integrations", label: "Integrations", icon: IconKey },
  { href: "/app/settings/notifications", label: "Notifications", icon: IconBell },
  { href: "/app/settings/security", label: "Security", icon: IconShield },
  { href: "/app/settings/privacy", label: "Privacy & Data", icon: IconLock },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings navigation" className="flex space-x-1 overflow-x-auto rounded-control border border-border-decorative bg-surface p-1 text-sm font-medium">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-control px-3.5 py-2 whitespace-nowrap transition-colors",
              active
                ? "bg-canvas text-ink font-semibold shadow-xs"
                : "text-text-secondary hover:text-ink hover:bg-canvas/50"
            )}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
