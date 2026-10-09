import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

/**
 * ReachBee icon set — drawn on the brand's 30°/150° isometric honeycomb grid so
 * glyphs read as ours rather than a stock library's. `viewBox` is 24×24,
 * stroke inherits `currentColor`, and geometry uses the same chevron language
 * as the BrandMark.
 *
 * Icons are decorative by default (`aria-hidden`); pass `title` when the glyph
 * is the only label.
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
  title?: string;
  strokeWidth?: number;
};

function Glyph({
  size = 18,
  className,
  title,
  strokeWidth = 1.6,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable={false}
      className={cn("shrink-0", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ---------------------------------- nav ---------------------------------- */

export function IconComb(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3.4l7.2 4.2v8.8L12 20.6l-7.2-4.2V7.6z" />
      <path d="M12 8.6l3 1.8v3.2L12 15.4l-3-1.8v-3.2z" opacity={0.45} />
    </Glyph>
  );
}

export function IconRadar(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16" opacity={0.28} />
      <circle cx="14.6" cy="9.4" r="2.3" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function IconPocket(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 4.2h10.8v15.4L12 16l-5.4 3.6z" />
      <path d="M9.6 8.4h4.8" opacity={0.45} />
    </Glyph>
  );
}

export function IconPocketFilled(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 4.2h10.8v15.4L12 16l-5.4 3.6z" fill="currentColor" />
    </Glyph>
  );
}

export function IconDraft(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.4 3.6h7.2L18.6 8.6v11.8H6.4z" />
      <path d="M13.6 3.6v5h5" />
      <path d="M9.2 12.6h5.6M9.2 16h3.8" opacity={0.55} />
    </Glyph>
  );
}

export function IconStencil(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="4.2" y="4.2" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.2" y="4.2" width="6.6" height="6.6" rx="1.4" />
      <rect x="4.2" y="13.2" width="6.6" height="6.6" rx="1.4" />
      <path d="M16.5 13.2v6.6M13.2 16.5h6.6" opacity={0.7} />
    </Glyph>
  );
}

export function IconPerson(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="8.4" r="3.7" />
      <path d="M5.6 20c1.2-3.3 3.7-4.9 6.4-4.9s5.2 1.6 6.4 4.9" />
    </Glyph>
  );
}

export function IconPeople(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="9.6" cy="8.8" r="3.2" />
      <path d="M4 19.4c1-2.8 3.1-4.2 5.6-4.2s4.6 1.4 5.6 4.2" />
      <path d="M16 5.8a3 3 0 010 5.9M17.4 15.6c1.4.6 2.3 1.8 2.8 3.6" opacity={0.6} />
    </Glyph>
  );
}

export function IconFlow(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.4 6.4h3.8v12H4.4zM10.1 6.4h3.8v8.2h-3.8zM15.8 6.4h3.8v5.4h-3.8z" />
    </Glyph>
  );
}

export function IconTrail(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.6 15.4h3.6l2.2-6.6 3 10 2.4-7.2 1.6 3.8h4" />
    </Glyph>
  );
}

export function IconToken(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4.2l6.4 3.7v7.4L12 19.8l-6.4-3.7V7.9z" />
      <path d="M12 8.8v6.4M9.9 10.4h4.2M9.9 13.4h4.2" opacity={0.6} />
    </Glyph>
  );
}

export function IconControls(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 8.4h9M18.4 8.4H20M4 15.6h3.6M13 15.6h7" />
      <circle cx="15.4" cy="8.4" r="2.1" />
      <circle cx="10" cy="15.6" r="2.1" />
    </Glyph>
  );
}

export function IconLifeRing(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.7 9.7c.3-1.3 1.3-2.2 2.5-2.2 1.4 0 2.4 1 2.4 2.3 0 1.9-2.3 2-2.3 3.9" />
      <circle cx="12.2" cy="16.7" r=".95" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 16.4c.9-1.2 1.3-2.3 1.3-4.2 0-3 1.6-5 4.1-5s4.1 2 4.1 5c0 1.9.4 3 1.3 4.2z" />
      <path d="M10.4 19.1c.4.8.9 1.2 1.6 1.2s1.2-.4 1.6-1.2" />
      <path d="M12 5.1V3.5" opacity={0.6} />
    </Glyph>
  );
}

export function IconExit(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M13.4 4.4H6.2v15.2h7.2" />
      <path d="M16.4 8.6l3.6 3.4-3.6 3.4M10 12h9.6" />
    </Glyph>
  );
}

/* --------------------------------- actions -------------------------------- */

export function IconCompose(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.6 19.4l.9-3.6L15.9 5.9l2.3 2.3L8 18.5z" />
      <path d="M14 7.8l2.3 2.3" opacity={0.6} />
    </Glyph>
  );
}

export function IconSend(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.2 7.2h15.6v10.4H4.2z" />
      <path d="M4.2 7.8L12 13.4l7.8-5.6" />
    </Glyph>
  );
}

export function IconBee(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 7.6l4.4 2.6v5L12 17.8l-4.4-2.6v-5z" />
      <path d="M9.2 6.2L7.6 4.2M14.8 6.2l1.6-2" opacity={0.75} />
      <path d="M12 10.2v5.2" opacity={0.4} />
    </Glyph>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="11" cy="11" r="6.4" />
      <path d="M15.7 15.7l4.1 4.1" />
    </Glyph>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Glyph {...props} strokeWidth={props.strokeWidth ?? 1.9}>
      <path d="M4.8 12.6l4.5 4.5L19.2 7" />
    </Glyph>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="8.6" y="8.6" width="10.8" height="10.8" rx="2" />
      <path d="M15.4 5.6H6.2a1.4 1.4 0 00-1.4 1.4v9.2" opacity={0.6} />
    </Glyph>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 15.8V4.6M8.4 8.2L12 4.6l3.6 3.6" />
      <path d="M4.6 14.6V19h14.8v-4.4" />
    </Glyph>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4.6v11.2M8.4 12.2l3.6 3.6 3.6-3.6" />
      <path d="M4.6 15.4V19h14.8v-3.6" />
    </Glyph>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.8 7.2h14.4M9.8 4.8h4.4M6.8 7.2l.8 12.8h8.8l.8-12.8" />
      <path d="M10.4 10.6v6M13.6 10.6v6" opacity={0.5} />
    </Glyph>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 5.4v13.2M5.4 12h13.2" />
    </Glyph>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M19.2 12a7.2 7.2 0 11-2.3-5.3" />
      <path d="M19.6 4.4v3.6H16" />
    </Glyph>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="5.2" y="10.6" width="13.6" height="9" rx="2" />
      <path d="M8.6 10.6V8.4a3.4 3.4 0 016.8 0v2.2" />
    </Glyph>
  );
}

export function IconKey(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="8.2" cy="12" r="3.6" />
      <path d="M11.8 12H20M16.8 12v3.2M13.8 12v2.2" />
    </Glyph>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3.6l7 2.6v5.6c0 3.9-2.9 6.5-7 8.6-4.1-2.1-7-4.7-7-8.6V6.2z" />
      <path d="M9.2 11.9l2 2 3.7-4.2" />
    </Glyph>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4.6l7.8 13.6H4.2z" />
      <path d="M12 9.4v3.8" />
      <circle cx="12" cy="15.9" r=".95" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11.2v4.4" />
      <circle cx="12" cy="8.4" r=".95" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.2 3.6v16.8M6.2 5.4h11l-2.2 3.7 2.2 3.7h-11" />
    </Glyph>
  );
}

export function IconMerge(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="8" cy="6.4" r="2.4" />
      <circle cx="8" cy="17.6" r="2.4" />
      <circle cx="16" cy="12" r="2.4" />
      <path d="M8 8.8v6.4M10.4 6.4h1.6a2.4 2.4 0 012.4 2.4v1" opacity={0.8} />
    </Glyph>
  );
}

export function IconExport(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 15.4V4.4M8.6 7.8L12 4.4l3.4 3.4" />
      <path d="M5 14.6v4.6h14v-4.6" />
      <path d="M9 12.4H5.6" opacity={0.4} />
    </Glyph>
  );
}

/* --------------------------------- arrows ---------------------------------- */

export function IconArrowRight(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.6 12h13.8M13.6 7.2l4.8 4.8-4.8 4.8" />
    </Glyph>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M19.4 12H5.6M10.4 7.2l-4.8 4.8 4.8 4.8" />
    </Glyph>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7 17L17 7M8.6 7H17v8.4" />
    </Glyph>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 9.4L12 14.8l5.4-5.4" />
    </Glyph>
  );
}

/* ------------------------------ chrome / misc ------------------------------ */

export function IconMenu(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.2 7.6h15.6M4.2 12h15.6M4.2 16.4h10.4" />
    </Glyph>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8" />
    </Glyph>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="3.9" />
      <path d="M12 3.6v2M12 18.4v2M3.6 12h2M18.4 12h2M6.1 6.1l1.4 1.4M16.5 16.5l1.4 1.4M17.9 6.1l-1.4 1.4M7.5 16.5l-1.4 1.4" />
    </Glyph>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M20.2 14.4A8.6 8.6 0 019.6 3.8a8.6 8.6 0 1010.6 10.6z" />
    </Glyph>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.6V12l3.4 2" />
    </Glyph>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.2 12.6h4.2l1.4 2.6h4.4l1.4-2.6h4.2" />
      <path d="M6.4 4.6h11.2l3.2 8v6.8H4.2v-6.8z" />
    </Glyph>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.4 6.4h15.2L14 12.6v5.6l-4 1.4v-7z" />
    </Glyph>
  );
}

/** Async work happening right now. Rotation stops with the task, never loops idly. */
export function IconBusy({ className, size = 18, ...rest }: IconProps) {
  return (
    <Glyph size={size} className={cn("ab-spin", className)} {...rest}>
      <path d="M12 4.2a7.8 7.8 0 017.8 7.8" strokeWidth={2} />
      <path d="M19.4 12A7.4 7.4 0 0112 19.4" opacity={0.35} />
    </Glyph>
  );
}
