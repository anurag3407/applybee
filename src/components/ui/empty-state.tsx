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
        "flex flex-col items-center gap-4 rounded-card border border-dashed border-border-decorative",
        "bg-surface-subtle/40 px-6 py-10 text-center",
        className,
      )}
    >
      {Figure ? <Figure size={150} /> : null}
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
