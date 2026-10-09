import Link from "next/link";
import { IconSend, IconBee } from "@/components/svg/icons";
import { CountUp } from "@/components/motion";
import { cn } from "@/lib/cn";

/**
 * Credit strip with independently named balances; click opens the ledger.
 * Only real numbers are drawn — there is no plan ceiling in the balance
 * record, so nothing here is rendered as a percentage of a made-up limit.
 */
export function CreditStrip({
  contact,
  ai,
}: {
  contact: { available: number; reserved: number };
  ai: { available: number; reserved: number };
}) {
  return (
    <div className="rounded-card border border-border-decorative bg-surface-subtle/70 p-3">
      <p className="mb-2 text-xs font-bold text-text-disabled">Your credits</p>
      <div className="space-y-1.5">
        <CreditLine
          href="/app/billing/credits?type=contact"
          icon={<IconSend size={14} />}
          label="Contact reveals"
          available={contact.available}
          reserved={contact.reserved}
        />
        <CreditLine
          href="/app/billing/credits?type=ai"
          icon={<IconBee size={14} />}
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
      className={cn(
        "ab-press flex items-center justify-between gap-2 rounded-control px-2 py-1.5",
        "hover:bg-surface hover:ring-1 hover:ring-border-decorative",
      )}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
        <span aria-hidden className="text-text-secondary">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <CountUp value={available} className="text-sm font-bold text-ink" />
        {reserved > 0 ? (
          <span className="text-[11px] font-semibold text-warning">+{reserved} in use</span>
        ) : null}
      </span>
    </Link>
  );
}

export { cn };
