import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Accessible primitives styled from semantic tokens (§8). Primary = ink on
 * ivory; accent = honey + ink (reserved for selected public CTAs); never
 * white-on-yellow.
 */

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-surface hover:bg-ink-soft border border-ink",
  secondary: "bg-surface text-ink border border-border-control hover:bg-surface-subtle",
  accent: "bg-honey text-ink border border-honey-deep hover:bg-honey-wash",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-surface-subtle",
  danger: "bg-danger-wash text-danger border border-danger hover:bg-danger hover:text-surface-wash",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "md" | "sm" }
>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "min-h-11 px-5 text-[0.95rem]" : "min-h-9 px-3.5 text-sm",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink",
        "placeholder:text-text-disabled focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-control border border-border-control bg-surface px-3 py-2.5 text-ink",
          "placeholder:text-text-disabled focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-control border border-border-control bg-surface px-3 text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-sm font-semibold text-ink", className)} {...props}>
      {children}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-card border border-border-decorative bg-surface p-5 shadow-card", className)}>
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "honey";
  className?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-subtle text-ink border-border-decorative",
    success: "bg-success-wash text-success border-success/30",
    warning: "bg-warning-wash text-warning border-warning/30",
    danger: "bg-danger-wash text-danger border-danger/30",
    info: "bg-info-wash text-info border-info/30",
    honey: "bg-honey-wash text-ink border-honey",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Status chip: icon + short label; color is never the only signal (§8.4). */
export function StatusChip({ status, label }: { status: "neutral" | "success" | "warning" | "danger" | "info"; label: string }) {
  const dot: Record<string, string> = {
    neutral: "bg-text-disabled",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  };
  return (
    <Badge tone={status === "neutral" ? "neutral" : status}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {label}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-decorative bg-surface px-6 py-12 text-center">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="max-w-md text-sm text-text-secondary">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-surface-subtle", className)} />;
}

export function InlineError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-control border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}
