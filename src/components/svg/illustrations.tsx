import { cn } from "@/lib/cn";

/**
 * Empty/loading/error illustrations. Each one depicts the actual object the
 * screen is missing (a draft sheet, a radar sweep, a pipeline column) so the
 * picture carries information instead of decorating space. Drawn once on mount
 * via stroke-dashoffset — a finite entrance, not an idle loop.
 */

type Props = { className?: string; size?: number };

function Frame({
  className,
  size = 168,
  label,
  children,
}: Props & { label?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 168 120"
      width={size}
      height={(size * 120) / 168}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("ab-draw overflow-visible", className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ink = "var(--ab-text-secondary)";
const faint = "var(--ab-border-decorative)";
const honey = "var(--ab-honey-deep)";

/** Faint comb cells shared by every scene — the brand motif doing the work. */
function Combs() {
  return (
    <g stroke={faint} strokeWidth="1.4" opacity="0.85">
      <path d="M18 96l7-4.2 7 4.2v8.4l-7 4.2-7-4.2z" />
      <path d="M132 22l7-4.2 7 4.2v8.4l-7 4.2-7-4.2z" />
      <path d="M146 84l6-3.6 6 3.6v7.2l-6 3.6-6-3.6z" opacity="0.6" />
    </g>
  );
}

/** Drafts / templates: an empty sheet with a pen path that never lands. */
export function IllustDraft({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <g stroke={ink} strokeWidth="1.8">
        <path d="M52 22h44l20 20v56H52z" />
        <path d="M96 22v20h20" />
      </g>
      <g stroke={faint} strokeWidth="2.2">
        <path d="M64 58h44M64 70h44M64 82h26" />
      </g>
      <path d="M104 74l14 14" stroke={honey} strokeWidth="2.2" />
      <path d="M116 86l4-1 1 4-9 3z" stroke={honey} strokeWidth="1.8" />
    </Frame>
  );
}

/** Contacts: radar ring with no return yet. */
export function IllustContacts({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <circle cx="84" cy="60" r="34" stroke={ink} strokeWidth="1.8" />
      <circle cx="84" cy="60" r="20" stroke={faint} strokeWidth="1.6" />
      <path d="M84 26v68M50 60h68" stroke={faint} strokeWidth="1.4" opacity="0.7" />
      <path d="M84 60l24-24" stroke={honey} strokeWidth="2" />
      <circle cx="84" cy="60" r="3.4" fill={honey} stroke="none" />
      <circle cx="103" cy="44" r="2.6" stroke={ink} strokeWidth="1.6" strokeDasharray="3 3" />
    </Frame>
  );
}

/** Pipeline: three columns, the first one waiting for a card. */
export function IllustPipeline({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <g stroke={ink} strokeWidth="1.8">
        <path d="M26 30h32v60H26zM68 30h32v44H68zM110 30h32v28h-32z" />
      </g>
      <path d="M32 44h20M32 54h14" stroke={honey} strokeWidth="2" strokeDasharray="4 5" />
    </Frame>
  );
}

/** Saved: an empty pocket. */
export function IllustSaved({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <path d="M60 26h48v68l-24-15-24 15z" stroke={ink} strokeWidth="1.8" />
      <path d="M72 44h24" stroke={faint} strokeWidth="2" />
      <path d="M84 58v14M77 65h14" stroke={honey} strokeWidth="2" />
    </Frame>
  );
}

/** Notifications: a bell with nothing to ring. */
export function IllustNotifications({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <path
        d="M66 78c6-7 8-14 8-24 0-16 8-24 10-24s10 8 10 24c0 10 2 17 8 24z"
        stroke={ink}
        strokeWidth="1.8"
      />
      <path d="M78 84c2 5 4 7 6 7s4-2 6-7" stroke={ink} strokeWidth="1.8" />
      <path d="M54 40l-10-8M114 40l10-8" stroke={faint} strokeWidth="1.6" />
    </Frame>
  );
}

/** Resume upload: page entering the comb. */
export function IllustResume({ className }: Props) {
  return (
    <Frame className={className}>
      <g stroke={ink} strokeWidth="1.8">
        <path d="M40 24h40v44H40z" />
        <path d="M50 38h20M50 48h20M50 58h12" />
      </g>
      <path d="M84 60h40v40H84z" stroke={faint} strokeWidth="1.6" strokeDasharray="5 5" />
      <path d="M104 70v20M96 78l8-8 8 8" stroke={honey} strokeWidth="2" />
    </Frame>
  );
}

/** Billing: a token hex with an empty balance. */
export function IllustCredits({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <path d="M84 22l34 19v38l-34 19-34-19V41z" stroke={ink} strokeWidth="1.8" />
      <path d="M84 44v32M72 52h24M72 68h24" stroke={faint} strokeWidth="2" />
    </Frame>
  );
}

/** Templates: an empty stencil with placeholder cells. */
export function IllustStencil({ className }: Props) {
  return (
    <Frame className={className}>
      <Combs />
      <g stroke={ink} strokeWidth="1.8">
        <path d="M34 28h100v64H34z" />
        <path d="M34 44h100" />
      </g>
      <g stroke={faint} strokeWidth="1.8">
        <path d="M50 58h20v18H50zM82 58h20v18H82z" />
      </g>
      <path d="M114 58h12M114 68h12M114 78h8" stroke={honey} strokeWidth="2" strokeDasharray="4 5" />
    </Frame>
  );
}

/** 404: a comb cell with the exit missing. */
export function IllustLost({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M84 18l38 22v44l-38 22-38-22V40z" stroke={ink} strokeWidth="1.8" />
      <path d="M84 40l18 10v20l-18 10-18-10V50z" stroke={honey} strokeWidth="1.8" strokeDasharray="6 6" />
      <path d="M30 30l10 6M138 30l-10 6" stroke={faint} strokeWidth="1.6" />
    </Frame>
  );
}

/** Error: signal broken mid-flight. */
export function IllustError({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M20 74h28l12-30 14 46 12-26h8" stroke={ink} strokeWidth="1.8" />
      <path d="M104 64h44" stroke={faint} strokeWidth="2" strokeDasharray="4 6" />
      <circle cx="120" cy="64" r="9" stroke={honey} strokeWidth="2" />
      <path d="M120 59v7" stroke={honey} strokeWidth="2" />
      <circle cx="120" cy="71" r="1.6" fill={honey} stroke="none" />
    </Frame>
  );
}

/**
 * Loading: comb cells filling in sequence while data streams. Finite, quiet,
 * and it names what is arriving instead of spinning.
 */
export function IllustLoading({ className }: Props) {
  return (
    <Frame className={className} size={120} label="Loading">
      <g stroke={ink} strokeWidth="1.8" className="ab-comb-wave">
        <path d="M40 60l10-6 10 6v12l-10 6-10-6z" />
        <path d="M64 46l10-6 10 6v12l-10 6-10-6z" />
        <path d="M88 60l10-6 10 6v12l-10 6-10-6z" />
      </g>
    </Frame>
  );
}
