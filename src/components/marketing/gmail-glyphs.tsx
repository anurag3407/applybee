export type GlyphName =
  | "menu"
  | "search"
  | "sliders"
  | "help"
  | "star"
  | "star-outline"
  | "compose"
  | "inbox"
  | "clock"
  | "send"
  | "draft"
  | "archive"
  | "trash"
  | "paperclip"
  | "link"
  | "emoji"
  | "image"
  | "more"
  | "minimize"
  | "expand"
  | "collapse"
  | "close"
  | "chevron"
  | "arrow-left"
  | "check"
  | "reply";

export function Glyph({
  name,
  size = 18,
  className,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  if (name === "star") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className={className}
      >
        <path d="M12 3.4l2.7 5.5 6 .9-4.35 4.24 1.03 5.96L12 17.2l-5.38 2.8 1.03-5.96L3.3 9.8l6-.9L12 3.4z" />
      </svg>
    );
  }

  if (name === "star-outline") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden
        className={className}
      >
        <path d="M12 3.9l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8L12 3.9z" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {name === "menu" && <path d="M4 6h16M4 12h16M4 18h16" />}
      {name === "search" && (
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </>
      )}
      {name === "sliders" && (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <circle cx="9" cy="7" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="8" cy="17" r="2" />
        </>
      )}
      {name === "help" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.8 9.2a2.3 2.3 0 1 1 3.2 2.1c-.7.3-1 .8-1 1.5v.4" />
          <path d="M12 16.6h.01" />
        </>
      )}
      {name === "compose" && (
        <>
          <path d="M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" />
          <path d="M13.5 6.5l3 3" />
        </>
      )}
      {name === "inbox" && (
        <>
          <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" />
          <path d="M5.5 5.5h13l2 8v5h-17v-5l2-8z" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" />
        </>
      )}
      {name === "send" && (
        <>
          <path d="M21 3L10.5 13.5" />
          <path d="M21 3l-6.5 18-4-7.5L3 9.5 21 3z" />
        </>
      )}
      {name === "draft" && (
        <>
          <path d="M6 3.5h8l4 4V20.5H6z" />
          <path d="M14 3.5v4h4" />
          <path d="M9 12h6M9 15.5h6" />
        </>
      )}
      {name === "archive" && (
        <>
          <rect x="4" y="4" width="16" height="4" rx="1" />
          <path d="M6 8v11h12V8" />
          <path d="M10 12h4" />
        </>
      )}
      {name === "trash" && (
        <>
          <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
          <path d="M10 11v5M14 11v5" />
        </>
      )}
      {name === "paperclip" && (
        <path d="M8 12.5l6.5-6.5a3 3 0 1 1 4.2 4.2L11 18a4.5 4.5 0 0 1-6.4-6.4l7-7" />
      )}
      {name === "link" && (
        <>
          <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
          <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
        </>
      )}
      {name === "emoji" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
          <circle cx="9" cy="9.5" r=".6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9.5" r=".6" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "image" && (
        <>
          <rect x="3.5" y="5" width="17" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="M4.5 17l5-5 3.5 3.5 2.5-2.5 4 4" />
        </>
      )}
      {name === "more" && (
        <>
          <circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.1" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "minimize" && <path d="M6 18h12" />}
      {name === "expand" && <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />}
      {name === "collapse" && <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />}
      {name === "close" && <path d="M6 6l12 12M18 6L6 18" />}
      {name === "chevron" && <path d="M7 10l5 5 5-5" />}
      {name === "arrow-left" && <path d="M20 12H5M11 6l-6 6 6 6" />}
      {name === "check" && <path d="M5 12.5l4.5 4.5L19 6.5" />}
      {name === "reply" && (
        <>
          <path d="M10 14l-6-5 6-5" />
          <path d="M4 9h9a7 7 0 0 1 7 7v4" />
        </>
      )}
    </svg>
  );
}

export function GmailMark() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="23" height="17" rx="2" fill="var(--gm-surface)" stroke="var(--gm-rule)" />
      <path d="M3.2 15V4.2l8.8 6.7 8.8-6.7V15" fill="none" stroke="#EA4335" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M3.2 15V4.2l8.8 6.7" fill="none" stroke="#4285F4" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M20.8 15V4.2l-8.8 6.7" fill="none" stroke="#34A853" strokeWidth="2.7" strokeLinejoin="round" />
    </svg>
  );
}
