import { Badge } from "@/components/ui/primitives";
import { FeatureIcon } from "@/components/marketing/feature-icon";

type GlyphName =
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
  | "close"
  | "chevron";

function Glyph({
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
      {name === "close" && <path d="M6 6l12 12M18 6L6 18" />}
      {name === "chevron" && <path d="M7 10l5 5 5-5" />}
    </svg>
  );
}

function GmailMark() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="23" height="17" rx="2" fill="var(--gm-surface)" stroke="var(--gm-rule)" />
      <path d="M3.2 15V4.2l8.8 6.7 8.8-6.7V15" fill="none" stroke="#EA4335" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M3.2 15V4.2l8.8 6.7" fill="none" stroke="#4285F4" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M20.8 15V4.2l-8.8 6.7" fill="none" stroke="#34A853" strokeWidth="2.7" strokeLinejoin="round" />
    </svg>
  );
}

const mailRows = [
  {
    sender: "Lumen Analytics",
    subject: "Application received",
    snippet: "We have your details and will be in touch.",
    time: "10:42 AM",
    unread: true,
    starred: true,
    color: "#0b8043",
  },
  {
    sender: "ReachBee",
    subject: "Your weekly outreach summary",
    snippet: "Three drafts reviewed. One is still waiting for you.",
    time: "9:18 AM",
    unread: false,
    starred: false,
    color: "#7a5209",
  },
  {
    sender: "Kite Robotics",
    subject: "Platform engineering roles",
    snippet: "Two openings on the infrastructure team.",
    time: "Yesterday",
    unread: false,
    starred: false,
    color: "#5e35b1",
  },
];

export function HeroScene() {
  return (
    <figure className="relative" data-motion="reveal">
      <figcaption className="sr-only">
        Illustrative preview of a Gmail compose window staged by ReachBee: a grounded introduction to Priya Sharma at
        Lumen Analytics, built from two confirmed facts while one unsupported claim is held back.
      </figcaption>

      <div
        aria-hidden
        className="absolute -inset-8 -z-10 bg-[radial-gradient(60%_60%_at_62%_38%,var(--ab-honey-wash),transparent_72%)] opacity-70 dark:opacity-40"
      />

      <div className="absolute -top-7 right-4 z-10">
        <Badge tone="honey">Illustrative preview</Badge>
      </div>

      <div
        aria-hidden
        className="relative overflow-hidden rounded-scene border border-border-decorative bg-[var(--gm-bg)] shadow-float"
        style={{ fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' }}
      >
        <div className="flex h-12 items-center gap-2.5 border-b border-[var(--gm-rule)] px-3 sm:gap-3 sm:px-4">
          <Glyph name="menu" size={18} className="shrink-0 text-[var(--gm-muted)]" />
          <div className="flex shrink-0 items-center gap-1.5">
            <GmailMark />
            <span className="text-[1rem] font-medium tracking-[-0.02em] text-[var(--gm-muted)] sm:text-[1.125rem]">
              Gmail
            </span>
          </div>
          <div className="mx-auto flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-[var(--gm-search)] px-3.5 text-[var(--gm-muted)] sm:max-w-[20rem] sm:px-4">
            <Glyph name="search" size={15} className="shrink-0" />
            <span className="truncate text-[0.8125rem]">Search mail</span>
            <Glyph name="sliders" size={14} className="ml-auto hidden shrink-0 sm:block" />
          </div>
          <Glyph name="help" size={17} className="hidden shrink-0 text-[var(--gm-muted)] sm:block" />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7c4dff] text-[0.6875rem] font-semibold text-white">
            A
          </span>
        </div>

        <div className="relative h-[30rem] sm:h-[33rem]">
          <div className="flex h-full">
            <div className="hidden w-[9.5rem] shrink-0 flex-col px-2 pt-3 md:flex">
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--gm-surface)] px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                <Glyph name="compose" size={17} className="text-[var(--gm-blue)]" />
                <span className="text-[0.8125rem] font-medium text-[var(--gm-text)]">Compose</span>
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-3 rounded-r-full bg-[var(--gm-selected)] px-3 py-1.5 text-[0.8125rem] font-semibold text-[var(--gm-text)]">
                  <Glyph name="inbox" size={16} />
                  <span>Inbox</span>
                  <span className="ml-auto text-[0.6875rem]">12</span>
                </div>
                {[
                  { icon: "star" as const, label: "Starred" },
                  { icon: "clock" as const, label: "Snoozed" },
                  { icon: "send" as const, label: "Sent" },
                  { icon: "draft" as const, label: "Drafts" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-r-full px-3 py-1.5 text-[0.8125rem] text-[var(--gm-muted)]"
                  >
                    <Glyph name={item.icon} size={16} />
                    <span>{item.label}</span>
                    {item.label === "Drafts" ? (
                      <span className="ml-auto text-[0.6875rem] font-semibold text-[var(--gm-text)]">1</span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-[var(--gm-rule)] pt-2 text-[0.75rem] text-[var(--gm-muted)]">
                <div className="px-3 py-1.5">Meet</div>
                <div className="px-3 py-1.5">Chat</div>
              </div>
            </div>

            <div className="min-w-0 flex-1 bg-[var(--gm-surface)]">
              <div className="flex h-9 items-center gap-3 border-b border-[var(--gm-rule)] px-3 text-[var(--gm-muted)] sm:px-4">
                <span className="h-3.5 w-3.5 rounded-[2px] border border-[var(--gm-rule)]" />
                <Glyph name="archive" size={15} />
                <Glyph name="trash" size={15} />
                <span className="ml-auto text-[0.6875rem]">1-24 of 2,418</span>
              </div>
              <div className="flex items-end gap-4 border-b border-[var(--gm-rule)] px-4 text-[0.75rem] text-[var(--gm-muted)]">
                <span className="border-b-2 border-[var(--gm-blue)] pb-2 pt-2 font-medium text-[var(--gm-blue)]">
                  Primary
                </span>
                <span className="pb-2 pt-2">Promotions</span>
                <span className="pb-2 pt-2">Social</span>
              </div>
              <div>
                {mailRows.map((row) => (
                  <div
                    key={row.subject}
                    className="flex items-center gap-2 border-b border-[var(--gm-rule)] px-3 py-2.5 text-[0.75rem] sm:px-4"
                  >
                    <span className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-[var(--gm-rule)]" />
                    <Glyph
                      name={row.starred ? "star" : "star-outline"}
                      size={14}
                      className={row.starred ? "shrink-0 text-[var(--gm-star)]" : "shrink-0 text-[var(--gm-muted)]"}
                    />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.5625rem] font-semibold text-white" style={{ backgroundColor: row.color }}>
                      {row.sender.slice(0, 1)}
                    </span>
                    <span
                      className={
                        row.unread
                          ? "w-[6.5rem] shrink-0 truncate font-semibold text-[var(--gm-text)]"
                          : "w-[6.5rem] shrink-0 truncate text-[var(--gm-muted)]"
                      }
                    >
                      {row.sender}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[var(--gm-muted)]">
                      <span className={row.unread ? "font-semibold text-[var(--gm-text)]" : "text-[var(--gm-text)]"}>
                        {row.subject}
                      </span>
                      <span className="text-[var(--gm-muted)]"> - {row.snippet}</span>
                    </span>
                    <span className="shrink-0 text-[0.6875rem] text-[var(--gm-muted)]">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 right-0 flex h-[21rem] w-full flex-col overflow-hidden rounded-t-[0.75rem] border border-b-0 border-[var(--gm-rule)] bg-[var(--gm-surface)] shadow-[0_-2px_18px_rgba(0,0,0,0.16)] sm:w-[24rem]">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[0.8125rem] font-medium text-[var(--gm-text)]">New Message</span>
              <div className="flex items-center gap-2.5 text-[var(--gm-muted)]">
                <Glyph name="minimize" size={14} />
                <Glyph name="expand" size={14} />
                <Glyph name="close" size={14} />
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-[var(--gm-rule)] px-4 pb-2 text-[0.8125rem]">
              <span className="text-[var(--gm-muted)]">To</span>
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--gm-selected)] px-2 py-0.5 text-[0.75rem] text-[var(--gm-text)]">
                Priya Sharma
                <Glyph name="close" size={10} className="text-[var(--gm-muted)]" />
              </span>
              <span className="ml-auto flex gap-2 text-[0.75rem] text-[var(--gm-muted)]">
                <span>Cc</span>
                <span>Bcc</span>
              </span>
            </div>

            <div className="border-b border-[var(--gm-rule)] px-4 py-2.5 text-[0.8125rem] text-[var(--gm-text)]">
              <span className="block truncate">Platform role at Lumen, background that may fit</span>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden px-4 py-3 text-[0.8125rem] leading-[1.6] text-[var(--gm-text)]">
              <p>Hi Priya,</p>
              <p className="mt-2">
                Last year I built a realtime events pipeline handling 40k events a minute, and I led our checkout
                migration to TypeScript. I saw your team works on fintech analytics pipelines and would value a short
                conversation about where your platform is heading.
              </p>
              <p className="mt-2">Aarav</p>
            </div>

            <div className="flex items-center gap-1 border-t border-[var(--gm-rule)] px-2.5 py-1.5 text-[var(--gm-muted)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-semibold">
                A
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full">
                <Glyph name="paperclip" size={15} />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full">
                <Glyph name="link" size={15} />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full">
                <Glyph name="emoji" size={15} />
              </span>
              <span className="hidden h-7 w-7 items-center justify-center rounded-full sm:flex">
                <Glyph name="image" size={15} />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full">
                <Glyph name="more" size={15} />
              </span>
              <span className="ml-auto flex items-center gap-2">
                <Glyph name="trash" size={15} />
                <span className="flex items-stretch overflow-hidden rounded-full bg-[var(--gm-blue)] text-[0.75rem] font-medium text-[var(--gm-on-blue)]">
                  <span className="py-1.5 pl-4 pr-2.5">Send</span>
                  <span aria-hidden className="my-1 w-px bg-[var(--gm-on-blue)]/30" />
                  <span className="flex items-center pl-2 pr-3">
                    <Glyph name="chevron" size={12} />
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-12 left-5 hidden items-center gap-2 rounded-control border border-border-decorative bg-surface px-3 py-2 shadow-card sm:flex">
        <FeatureIcon name="review" size={13} className="text-success" />
        <span className="text-[0.75rem] font-semibold text-ink">2 facts cited · 1 claim held back</span>
      </div>
    </figure>
  );
}
