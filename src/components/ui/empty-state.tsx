import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  IllustContacts,
  IllustCredits,
  IllustDraft,
  IllustNotifications,
  IllustPipeline,
  IllustResume,
  IllustSaved,
  IllustStencil,
} from "@/components/svg/illustrations";

const art = {
  drafts: IllustDraft,
  templates: IllustStencil,
  contacts: IllustContacts,
  pipeline: IllustPipeline,
  saved: IllustSaved,
  notifications: IllustNotifications,
  resume: IllustResume,
  credits: IllustCredits,
} as const;

/**
 * Empty state: names why it is empty and offers the one action that fills it.
 * `art` draws the object that is missing — no generic placeholder blob.
 *
 * Separate module from `primitives`: the object literal mapping eight
 * illustrations to names kept all eight SVG scenes in the bundle of any client
 * component that imported `Button`.
 */
export function EmptyState({
  title,
  description,
  action,
  art: kind,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  art?: keyof typeof art;
  className?: string;
}) {
  const Figure = kind ? art[kind] : null;
  return (
    <div
      className={cn(
        "flex flex-col gap-6 border-t border-border-decorative pt-8 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="max-w-md">
        <h3 className="text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">{title}</h3>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-text-secondary">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
      {Figure ? <Figure size={132} className="mx-auto shrink-0 sm:mx-0" /> : null}
    </div>
  );
}
