import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { IconBusy } from "@/components/svg/icons";

/**
 * Accessible primitives styled from semantic tokens (§8). Primary = ink on
 * ivory; accent = honey, reserved for the single key action of a view.
 *
 * Hierarchy rule: surfaces sit flat by default. Elevation (`raised`) is spent
 * only where depth means something — an overlay, or the one block the view
 * asks you to act on.
 */

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "quiet";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-surface border border-ink hover:bg-ink-soft hover:border-ink-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
  secondary: "bg-surface text-ink border border-border-control hover:bg-surface-subtle hover:border-ink/35",
  accent: "bg-honey text-on-honey border border-honey-deep hover:bg-honey-deep hover:text-on-honey",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-surface-subtle",
  danger: "bg-transparent text-danger border border-danger/45 hover:bg-danger hover:text-surface",
  quiet: "bg-surface-subtle text-ink border border-transparent hover:bg-honey-wash",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: "lg" | "md" | "sm";
    icon?: ReactNode;
    trailingIcon?: ReactNode;
    busy?: boolean;
  }
>(function Button(
  { className, variant = "primary", size = "md", icon, trailingIcon, busy, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "ab-press group inline-flex items-center justify-center gap-2 rounded-control font-semibold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
        size === "lg" && "min-h-12 px-6 text-[1rem]",
        size === "md" && "min-h-11 px-5 text-[0.95rem]",
        size === "sm" && "min-h-9 px-3.5 text-sm",
        buttonStyles[variant],
        className,
      )}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? <IconBusy size={size === "sm" ? 14 : 16} /> : icon}
      {children}
      {trailingIcon}
    </button>
  );
});

/** Square icon-only control. Requires a label; the glyph never carries it. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "md" | "sm" }
>(function IconButton({ className, label, size = "md", children, ...props }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(
        "ab-press inline-flex items-center justify-center rounded-control border border-transparent",
        "text-text-secondary hover:border-border-decorative hover:bg-surface-subtle hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        size === "md" ? "h-10 w-10" : "h-9 w-9",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const fieldBase =
  "w-full rounded-control border border-border-control bg-surface text-ink " +
  "transition-[border-color,box-shadow] duration-[140ms] " +
  "hover:border-ink/40 " +
  "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus " +
  "disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, "h-11 px-3 placeholder:text-text-disabled", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldBase, "px-3 py-2.5 placeholder:text-text-disabled", className)}
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
    <select ref={ref} className={cn(fieldBase, "h-11 appearance-none bg-none px-3", className)} {...props}>
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
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger" role="alert">
      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-danger" />
      {children}
    </p>
  );
}

export function Card({
  className,
  children,
  raised,
  interactive,
  as: Tag = "div",
  ...rest
}: {
  className?: string;
  children: ReactNode;
  raised?: boolean;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "li";
  [key: string]: unknown;
}) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-border-decorative bg-surface",
        raised ? "ab-hairline shadow-float" : "shadow-none",
        interactive && "ab-lift hover:border-ink/25 hover:bg-surface-raised",
        "p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
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
    neutral: "bg-surface-subtle text-text-secondary border-border-decorative",
    success: "bg-success-wash text-success border-success/25",
    warning: "bg-warning-wash text-warning border-warning/25",
    danger: "bg-danger-wash text-danger border-danger/25",
    info: "bg-info-wash text-info border-info/25",
    honey: "bg-honey-wash text-ink border-honey/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status chip. The dot is a redundant cue next to the word, never the signal
 * on its own (§8.4) — so it only renders for statuses that are real states.
 */
export function StatusChip({
  status,
  label,
  busy,
}: {
  status: "neutral" | "success" | "warning" | "danger" | "info";
  label: string;
  busy?: boolean;
}) {
  const dot: Record<string, string> = {
    neutral: "bg-text-disabled",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  };
  return (
    <Badge tone={status === "neutral" ? "neutral" : status}>
      {busy ? (
        <IconBusy size={11} className="text-current" />
      ) : (
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      )}
      {label}
    </Badge>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("ab-shimmer rounded-control", className)} />;
}

/** Loading block that says what is arriving, sized to the content it waits for. */
export function LoadingState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-text-secondary">
      <IconBusy size={16} className="text-honey-deep" />
      <span>
        <span className="font-semibold text-ink">{label}</span>
        {hint ? <span className="ml-1.5">{hint}</span> : null}
      </span>
    </div>
  );
}

export function InlineError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger-wash px-3 py-2.5 text-sm text-danger"
      role="alert"
    >
      <span aria-hidden className="mt-[6px] h-2 w-2 shrink-0 rotate-45 bg-danger" />
      {children}
    </p>
  );
}

/**
 * Section header. Sentence-case labels carry the same weight as the tracked
 * uppercase ones they replace, without reading like a generated template.
 */
export function SectionHeading({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="space-y-1">
        <h3 className="text-[1.05rem] font-bold tracking-tight text-ink">{title}</h3>
        {hint ? <p className="text-sm text-text-secondary">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** One real metric. `meta` must be a fact about that same number. */
export function Metric({
  label,
  value,
  meta,
  meter,
  className,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  meter?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <p className="text-[1.75rem] font-extrabold leading-none tracking-tight text-ink">{value}</p>
      {meter}
      {meta ? <p className="text-xs text-text-disabled">{meta}</p> : null}
    </div>
  );
}
