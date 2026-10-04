import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/** Credit strip with independently named balances; click opens the ledger. */
export function CreditStrip({
  contact,
  ai,
}: {
  contact: { available: number; reserved: number };
  ai: { available: number; reserved: number };
}) {
  return (
    <div className="rounded-card border border-border-decorative bg-canvas p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-disabled">Your credits</p>
      <div className="space-y-2">
        <CreditLine
          href="/app/billing/credits?type=contact"
          icon={<Mail size={14} aria-hidden />}
          label="Contact reveals"
          available={contact.available}
          reserved={contact.reserved}
        />
        <CreditLine
          href="/app/billing/credits?type=ai"
          icon={<Sparkles size={14} aria-hidden />}
          label="AI generations"
          available={ai.available}
          reserved={ai.reserved}
        />
      </div>
    </div>
  );
}

function CreditLine({
  href,
  icon,
  label,
  available,
  reserved,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  available: number;
  reserved: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-control px-2 py-1.5 hover:bg-surface-subtle"
    >
      <span className="flex items-center gap-2 text-sm text-ink">
        <span aria-hidden className="text-text-secondary">
          {icon}
        </span>
        {label}
      </span>
      <span className="tabular text-sm font-bold text-ink">
        {available}
        {reserved > 0 ? <span className="ml-1 text-xs font-semibold text-text-disabled">+{reserved} in use</span> : null}
      </span>
    </Link>
  );
}

export { cn };
