"use client";

import { useEffect, useRef } from "react";
import { Glyph } from "./gmail-glyphs";
import {
  mailCategories,
  mailCountLabel,
  viewLabels,
  type DemoMail,
  type MailCategory,
  type MailView,
} from "./gmail-data";

type ReaderState = {
  mail: DemoMail;
  onBack: () => void;
  onStar: () => void;
  onReply: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

type MailboxProps = {
  visibleMails: DemoMail[];
  totalCount: number;
  view: MailView;
  tab: MailCategory;
  query: string;
  selected: string[];
  allSelected: boolean;
  draftCount: number;
  draftSubject: string;
  reader?: ReaderState;
  onTab: (tab: MailCategory) => void;
  onView: (view: MailView) => void;
  onOpen: (id: string) => void;
  onStar: (id: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onArchiveSelected: () => void;
  onDeleteSelected: () => void;
  onClearSearch: () => void;
  onRestoreMails: () => void;
  onContinueDraft: () => void;
  onCompose: () => void;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gm-blue)]";

function checkboxClass() {
  return `peer h-3.5 w-3.5 shrink-0 cursor-pointer appearance-none rounded-[2px] border border-[var(--gm-rule)] bg-transparent checked:border-[var(--gm-blue)] checked:bg-[var(--gm-blue)] ${focusRing}`;
}

function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-[0.875rem] font-semibold text-[var(--gm-text)]">{title}</p>
      <p className="mt-1.5 max-w-[30ch] text-[0.75rem] leading-relaxed text-[var(--gm-muted)]">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className={`mt-4 rounded-full border border-[var(--gm-rule)] px-4 py-1.5 text-[0.75rem] font-medium text-[var(--gm-text)] transition-colors hover:bg-[var(--gm-hover)] ${focusRing}`}
      >
        {action}
      </button>
    </div>
  );
}

export function Mailbox({
  visibleMails,
  totalCount,
  view,
  tab,
  query,
  selected,
  allSelected,
  draftCount,
  draftSubject,
  reader,
  onTab,
  onView,
  onOpen,
  onStar,
  onSelect,
  onSelectAll,
  onArchiveSelected,
  onDeleteSelected,
  onClearSearch,
  onRestoreMails,
  onContinueDraft,
  onCompose,
}: MailboxProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wasReader = useRef(false);
  const readerId = reader?.mail.id ?? null;

  useEffect(() => {
    if (readerId) {
      backRef.current?.focus();
      wasReader.current = true;
      return;
    }
    if (wasReader.current) {
      listRef.current?.focus();
      wasReader.current = false;
    }
  }, [readerId]);

  if (reader) {
    const { mail } = reader;
    return (
      <div className="flex h-full min-h-0 flex-col" role="region" aria-label={`Message: ${mail.subject}`}>
        <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--gm-rule)] px-2 text-[var(--gm-muted)] sm:px-3">
          <button
            ref={backRef}
            type="button"
            onClick={reader.onBack}
            aria-label="Back to messages"
            className={`flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] ${focusRing}`}
          >
            <Glyph name="arrow-left" size={16} />
          </button>
          <button
            type="button"
            onClick={reader.onArchive}
            aria-label="Archive this message"
            className={`flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] ${focusRing}`}
          >
            <Glyph name="archive" size={15} />
          </button>
          <button
            type="button"
            onClick={reader.onDelete}
            aria-label="Delete this message"
            className={`flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] ${focusRing}`}
          >
            <Glyph name="trash" size={15} />
          </button>
          <button
            type="button"
            onClick={reader.onStar}
            aria-pressed={mail.starred}
            aria-label={`${mail.starred ? "Unstar" : "Star"} this message`}
            className={`ml-auto flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--gm-hover)] ${focusRing} ${
              mail.starred ? "text-[var(--gm-star)]" : "text-[var(--gm-muted)]"
            }`}
          >
            <Glyph name={mail.starred ? "star" : "star-outline"} size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-[1.0625rem] font-semibold leading-snug text-[var(--gm-text)]">{mail.subject}</p>

          <div className="mt-4 flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold text-white"
              style={{ backgroundColor: mail.color }}
            >
              {mail.sender.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-semibold text-[var(--gm-text)]">{mail.sender}</p>
              <p className="truncate text-[0.75rem] text-[var(--gm-muted)]">{mail.email}</p>
              <p className="mt-0.5 text-[0.6875rem] text-[var(--gm-muted)]">
                to me <span className="ml-1.5">{mail.time}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-[var(--gm-rule)] pt-5 text-[0.8125rem] leading-[1.75] text-[var(--gm-text)]">
            {mail.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <button
            type="button"
            onClick={reader.onReply}
            className={`mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--gm-rule)] px-4 py-2 text-[0.75rem] font-medium text-[var(--gm-text)] transition-colors hover:bg-[var(--gm-hover)] ${focusRing}`}
          >
            <Glyph name="reply" size={14} />
            Reply
          </button>
        </div>
      </div>
    );
  }

  const shownCount = query ? visibleMails.length : view === "drafts" ? draftCount : visibleMails.length;
  const hasSelection = selected.length > 0;

  let content: React.ReactNode;

  if (!query && view === "drafts") {
    content =
      draftCount > 0 ? (
        <button
          type="button"
          onClick={onContinueDraft}
          aria-label={`Continue draft: ${draftSubject}`}
          className={`flex w-full items-center gap-3 border-b border-[var(--gm-rule)] px-4 py-4 text-left transition-colors hover:bg-[var(--gm-hover)] ${focusRing}`}
        >
          <Glyph name="draft" size={16} className="shrink-0 text-[var(--gm-blue)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.75rem] font-semibold text-[var(--gm-text)]">Draft</span>
            <span className="block truncate text-[0.75rem] text-[var(--gm-muted)]">{draftSubject}</span>
          </span>
          <span className="shrink-0 text-[0.6875rem] font-medium text-[var(--gm-blue)]">Continue</span>
        </button>
      ) : (
        <EmptyState
          title="No drafts yet."
          body="Start a message and close it to keep a draft in this demo."
          action="Write a message"
          onAction={onCompose}
        />
      );
  } else if (totalCount === 0) {
    content = (
      <EmptyState
        title="You cleared the demo inbox."
        body="Archiving and deleting only change this preview. Nothing touches a real mailbox."
        action="Restore example mails"
        onAction={onRestoreMails}
      />
    );
  } else if (query && visibleMails.length === 0) {
    content = (
      <EmptyState
        title="No matching messages."
        body={`Nothing in this demo matches “${query}”. Try a sender, subject, or word from a message.`}
        action="Clear search"
        onAction={onClearSearch}
      />
    );
  } else if (visibleMails.length === 0) {
    const copy =
      view === "starred"
        ? {
            title: "No starred messages.",
            body: "Star a message in the inbox and it will show up here.",
            action: "Back to Inbox",
            onAction: () => onView("inbox"),
          }
        : view === "inbox"
          ? {
              title: `No ${tab} messages.`,
              body: "This category is empty in the example mailbox. Primary has the three demo messages.",
              action: "Open Primary",
              onAction: () => onTab("primary"),
            }
          : {
              title: `Nothing in ${viewLabels[view]}.`,
              body: "This view stays empty in the demo because nothing is snoozed or sent.",
              action: "Back to Inbox",
              onAction: () => onView("inbox"),
            };
    content = <EmptyState {...copy} />;
  } else {
    content = visibleMails.map((mail) => (
      <div
        key={mail.id}
        className="flex items-center gap-0.5 border-b border-[var(--gm-rule)] py-1.5 pl-1 pr-3 text-[0.75rem] transition-colors hover:bg-[var(--gm-hover)] sm:gap-1.5 sm:px-2"
      >
        <label className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={selected.includes(mail.id)}
            onChange={() => onSelect(mail.id)}
            aria-label={`Select email from ${mail.sender}`}
            className={checkboxClass()}
          />
          <Glyph
            name="check"
            size={9}
            className="pointer-events-none absolute text-[var(--gm-on-blue)] opacity-0 peer-checked:opacity-100"
          />
        </label>
        <button
          type="button"
          onClick={() => onStar(mail.id)}
          aria-pressed={mail.starred}
          aria-label={`${mail.starred ? "Unstar" : "Star"} email from ${mail.sender}`}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${focusRing} ${
            mail.starred ? "text-[var(--gm-star)]" : "text-[var(--gm-muted)]"
          }`}
        >
          <Glyph name={mail.starred ? "star" : "star-outline"} size={14} />
        </button>
        <button
          type="button"
          onClick={() => onOpen(mail.id)}
          aria-label={`Open email from ${mail.sender}: ${mail.subject}${mail.unread ? ". Unread" : ""}`}
          className={`flex min-w-0 flex-1 items-center gap-2 py-1 text-left ${focusRing}`}
        >
          <span
            aria-hidden
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.5625rem] font-semibold text-white sm:flex"
            style={{ backgroundColor: mail.color }}
          >
            {mail.sender.slice(0, 1)}
          </span>
          <span
            className={`w-[6rem] shrink-0 truncate text-[0.75rem] sm:w-[6.5rem] ${
              mail.unread ? "font-semibold text-[var(--gm-text)]" : "text-[var(--gm-muted)]"
            }`}
          >
            {mail.sender}
          </span>
          <span className="min-w-0 flex-1 truncate text-[0.75rem] text-[var(--gm-muted)]">
            <span className={mail.unread ? "font-semibold text-[var(--gm-text)]" : "text-[var(--gm-text)]"}>
              {mail.subject}
            </span>
            <span className="text-[var(--gm-muted)]"> - {mail.snippet}</span>
          </span>
          {mail.unread ? (
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gm-blue)] sm:hidden" />
          ) : null}
          <span className="hidden shrink-0 text-[0.6875rem] text-[var(--gm-muted)] sm:inline">{mail.time}</span>
        </button>
      </div>
    ));
  }

  return (
    <div
      ref={listRef}
      tabIndex={-1}
      role="region"
      aria-label={viewLabels[view]}
      className="flex h-full min-h-0 flex-col outline-none"
    >
      <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-[var(--gm-rule)] px-2 text-[var(--gm-muted)] sm:gap-1 sm:px-3">
        <label className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            disabled={visibleMails.length === 0}
            aria-label="Select all messages in this view"
            className={`${checkboxClass()} disabled:cursor-not-allowed disabled:opacity-40`}
          />
          <Glyph
            name="check"
            size={9}
            className="pointer-events-none absolute text-[var(--gm-on-blue)] opacity-0 peer-checked:opacity-100"
          />
        </label>
        <button
          type="button"
          onClick={onArchiveSelected}
          disabled={!hasSelection}
          aria-label="Archive selected messages"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
        >
          <Glyph name="archive" size={15} />
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          aria-label="Delete selected messages"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
        >
          <Glyph name="trash" size={15} />
        </button>
        <span className="ml-auto text-[0.6875rem]" aria-live="polite">
          {mailCountLabel(shownCount)}
        </span>
      </div>

      <div className="flex shrink-0 items-end gap-4 border-b border-[var(--gm-rule)] px-4 text-[0.75rem] text-[var(--gm-muted)]">
        {view === "inbox" && !query ? (
          <div role="group" aria-label="Message categories" className="flex items-end gap-4">
            {mailCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={tab === category.id}
                onClick={() => onTab(category.id)}
                className={`-mb-px border-b-2 pb-2 pt-2 font-medium transition-colors ${focusRing} ${
                  tab === category.id
                    ? "border-[var(--gm-blue)] text-[var(--gm-blue)]"
                    : "border-transparent hover:text-[var(--gm-text)]"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2 py-2">
            <span className="shrink-0 font-medium text-[var(--gm-text)]">
              {query ? "Search results" : viewLabels[view]}
            </span>
            {query ? <span className="truncate">for “{query}”</span> : null}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
    </div>
  );
}
