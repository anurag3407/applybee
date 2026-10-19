"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Glyph, GmailMark, type GlyphName } from "./gmail-glyphs";
import { Mailbox } from "./gmail-mailbox";
import { Composer } from "./gmail-composer";
import {
  initialComposer,
  initialMails,
  type ComposerState,
  type DemoMail,
  type MailCategory,
  type MailView,
} from "./gmail-data";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gm-blue)]";

const navItems: Array<{ id: MailView; icon: GlyphName; label: string }> = [
  { id: "inbox", icon: "inbox", label: "Inbox" },
  { id: "starred", icon: "star-outline", label: "Starred" },
  { id: "snoozed", icon: "clock", label: "Snoozed" },
  { id: "sent", icon: "send", label: "Sent" },
  { id: "drafts", icon: "draft", label: "Drafts" },
];

export function GmailPreview() {
  const [mails, setMails] = useState<DemoMail[]>(initialMails);
  const [view, setView] = useState<MailView>("inbox");
  const [tab, setTab] = useState<MailCategory>("primary");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerState>(initialComposer);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const minimizedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const currentMail = openId ? mails.find((mail) => mail.id === openId) ?? null : null;
  const unreadCount = mails.filter((mail) => mail.unread).length;
  const starredCount = mails.filter((mail) => mail.starred).length;
  const draftCount = composer.subject.trim() || composer.body.trim() ? 1 : 0;

  const visibleMails = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      return mails.filter((mail) =>
        [mail.sender, mail.email, mail.subject, mail.snippet, ...mail.body]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      );
    }
    if (view === "inbox") {
      return mails.filter((mail) => mail.category === tab);
    }
    if (view === "starred") {
      return mails.filter((mail) => mail.starred);
    }
    return [];
  }, [mails, query, tab, view]);

  const allSelected = visibleMails.length > 0 && visibleMails.every((mail) => selected.includes(mail.id));

  function changeView(next: MailView) {
    setView(next);
    setQuery("");
    setOpenId(null);
    setSelected([]);
    setTab("primary");
  }

  function changeTab(next: MailCategory) {
    setTab(next);
    setSelected([]);
  }

  function changeQuery(next: string) {
    setQuery(next);
    setOpenId(null);
    setSelected([]);
  }

  function openMail(id: string) {
    setOpenId(id);
    setMails((current) => current.map((mail) => (mail.id === id ? { ...mail, unread: false } : mail)));
    setSelected([]);
    if (composer.mode === "open") {
      setComposer((current) => ({ ...current, mode: "minimized" }));
    }
  }

  function toggleStar(id: string) {
    setMails((current) =>
      current.map((mail) => (mail.id === id ? { ...mail, starred: !mail.starred } : mail)),
    );
  }

  function toggleSelect(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleSelectAll() {
    setSelected(allSelected ? [] : visibleMails.map((mail) => mail.id));
  }

  function removeMails(ids: string[], verb: "Archived" | "Deleted") {
    if (ids.length === 0) return;
    setMails((current) => current.filter((mail) => !ids.includes(mail.id)));
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    if (openId && ids.includes(openId)) setOpenId(null);
    setStatus(`${verb} ${ids.length} message${ids.length === 1 ? "" : "s"} in this demo.`);
  }

  function restoreMails() {
    setMails(initialMails);
    setView("inbox");
    setTab("primary");
    setQuery("");
    setSelected([]);
    setOpenId(null);
    setStatus("Example messages restored.");
  }

  function patchComposer(patch: Partial<ComposerState>) {
    setComposer((current) => ({ ...current, ...patch }));
    if ("to" in patch) setComposeError(null);
  }

  function openBlankCompose() {
    setComposer({
      mode: "open",
      expanded: false,
      to: "",
      subject: "",
      body: "",
      cc: "",
      bcc: "",
      showCc: false,
    });
    setComposeError(null);
    setStatus(null);
    requestAnimationFrame(() => toRef.current?.focus());
  }

  function restoreComposer() {
    setComposer((current) => ({ ...current, mode: "open" }));
    setComposeError(null);
    requestAnimationFrame(() => bodyRef.current?.focus());
  }

  function handleComposeTrigger() {
    if (composer.mode === "open") {
      bodyRef.current?.focus();
      return;
    }
    if (composer.mode === "minimized") {
      restoreComposer();
      return;
    }
    if (composer.subject.trim() || composer.body.trim()) {
      restoreComposer();
      return;
    }
    openBlankCompose();
  }

  function startReply(mail: DemoMail) {
    setComposer({
      mode: "open",
      expanded: false,
      to: mail.sender,
      subject: `Re: ${mail.subject}`,
      body: "",
      cc: "",
      bcc: "",
      showCc: false,
    });
    setComposeError(null);
    setStatus(null);
    requestAnimationFrame(() => bodyRef.current?.focus());
  }

  function closeComposer() {
    setComposer((current) => ({ ...current, mode: "closed" }));
    setComposeError(null);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function minimizeComposer() {
    setComposer((current) => ({ ...current, mode: "minimized" }));
    requestAnimationFrame(() => minimizedRef.current?.focus());
  }

  function discardDraft() {
    setComposer({
      mode: "closed",
      expanded: false,
      to: "",
      subject: "",
      body: "",
      cc: "",
      bcc: "",
      showCc: false,
    });
    setComposeError(null);
    setStatus("Draft discarded in this demo.");
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function sendDemo() {
    if (!composer.to.trim()) {
      setComposeError("Add a recipient before sending.");
      toRef.current?.focus();
      return;
    }
    setComposeError(null);
    setStatus("Demo only. Nothing was sent.");
  }

  function removeRecipient() {
    patchComposer({ to: "" });
    requestAnimationFrame(() => toRef.current?.focus());
  }

  function clearSearch() {
    changeQuery("");
    searchRef.current?.focus();
  }

  return (
    <div
      role="group"
      aria-label="Interactive Gmail preview"
      className="relative overflow-hidden rounded-scene border border-border-decorative bg-[var(--gm-bg)] shadow-float"
      style={{ fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-[var(--gm-rule)] px-3 sm:gap-3 sm:px-4">
        <Glyph name="menu" size={18} className="shrink-0 text-[var(--gm-muted)]" />
        <div aria-hidden className="flex shrink-0 items-center gap-1.5">
          <GmailMark />
          <span className="text-[1rem] font-medium tracking-[-0.02em] text-[var(--gm-muted)] sm:text-[1.125rem]">
            Gmail
          </span>
        </div>
        <div className="mx-auto flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-[var(--gm-search)] px-3.5 text-[var(--gm-muted)] transition-shadow focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--gm-blue)]/60 sm:max-w-[20rem] sm:px-4">
          <Glyph name="search" size={15} className="shrink-0" />
          <label htmlFor="gmail-search" className="sr-only">
            Search example mail
          </label>
          <input
            ref={searchRef}
            id="gmail-search"
            type="search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                clearSearch();
              }
            }}
            placeholder="Search mail"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--gm-text)] outline-none placeholder:text-[var(--gm-muted)] [&::-webkit-search-cancel-button]:appearance-none sm:text-[0.8125rem]"
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-black/10 hover:text-[var(--gm-text)] dark:hover:bg-white/10 ${focusRing}`}
            >
              <Glyph name="close" size={12} />
            </button>
          ) : (
            <Glyph name="sliders" size={14} className="ml-auto hidden shrink-0 sm:block" />
          )}
        </div>
        <Glyph name="help" size={17} className="hidden shrink-0 text-[var(--gm-muted)] sm:block" />
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7c4dff] text-[0.6875rem] font-semibold text-white"
        >
          A
        </span>
      </div>

      <div className="relative h-[30rem] sm:h-[33rem]">
        <div className="flex h-full">
          <aside className="hidden w-[9.5rem] shrink-0 flex-col px-2 pt-3 md:flex">
            <button
              type="button"
              onClick={handleComposeTrigger}
              className={`flex items-center gap-3 rounded-2xl bg-[var(--gm-surface)] px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-[var(--gm-hover)] ${focusRing}`}
            >
              <Glyph name="compose" size={17} className="shrink-0 text-[var(--gm-blue)]" />
              <span className="text-[0.8125rem] font-medium text-[var(--gm-text)]">Compose</span>
            </button>

            <nav aria-label="Example mailboxes" className="mt-2 space-y-0.5">
              {navItems.map((item) => {
                const count =
                  item.id === "inbox"
                    ? unreadCount
                    : item.id === "starred"
                      ? starredCount
                      : item.id === "drafts"
                        ? draftCount
                        : 0;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeView(item.id)}
                    aria-label={
                      item.id === "inbox"
                        ? `Inbox${count > 0 ? `, ${count} unread` : ""}`
                        : `${item.label}${count > 0 ? `, ${count}` : ""}`
                    }
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-r-full px-3 py-1.5 text-left text-[0.8125rem] transition-colors ${focusRing} ${
                      active
                        ? "bg-[var(--gm-selected)] font-semibold text-[var(--gm-text)]"
                        : "text-[var(--gm-muted)] hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)]"
                    }`}
                  >
                    <Glyph name={item.icon} size={16} className="shrink-0" />
                    <span>{item.label}</span>
                    {count > 0 ? (
                      <span className={`ml-auto text-[0.6875rem] ${active ? "" : "font-semibold"}`}>{count}</span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div aria-hidden className="mt-3 border-t border-[var(--gm-rule)] pt-2 text-[0.75rem] text-[var(--gm-muted)]">
              <div className="px-3 py-1.5">Meet</div>
              <div className="px-3 py-1.5">Chat</div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 bg-[var(--gm-surface)]">
            <Mailbox
              visibleMails={visibleMails}
              totalCount={mails.length}
              view={view}
              tab={tab}
              query={query}
              selected={selected}
              allSelected={allSelected}
              draftCount={draftCount}
              draftSubject={composer.subject.trim() || "No subject"}
              reader={
                currentMail
                  ? {
                      mail: currentMail,
                      onBack: () => setOpenId(null),
                      onStar: () => toggleStar(currentMail.id),
                      onReply: () => startReply(currentMail),
                      onArchive: () => removeMails([currentMail.id], "Archived"),
                      onDelete: () => removeMails([currentMail.id], "Deleted"),
                    }
                  : undefined
              }
              onTab={changeTab}
              onView={changeView}
              onOpen={openMail}
              onStar={toggleStar}
              onSelect={toggleSelect}
              onSelectAll={toggleSelectAll}
              onArchiveSelected={() => removeMails(selected, "Archived")}
              onDeleteSelected={() => removeMails(selected, "Deleted")}
              onClearSearch={clearSearch}
              onRestoreMails={restoreMails}
              onContinueDraft={handleComposeTrigger}
              onCompose={openBlankCompose}
            />
          </div>
        </div>

        <Composer
          state={composer}
          error={composeError}
          onPatch={patchComposer}
          onSend={sendDemo}
          onClose={closeComposer}
          onMinimize={minimizeComposer}
          onRestore={restoreComposer}
          onExpand={() => setComposer((current) => ({ ...current, expanded: !current.expanded }))}
          onDiscard={discardDraft}
          onRemoveRecipient={removeRecipient}
          toRef={toRef}
          subjectRef={subjectRef}
          bodyRef={bodyRef}
          minimizedRef={minimizedRef}
        />

        {composer.mode === "closed" ? (
          <button
            type="button"
            onClick={handleComposeTrigger}
            aria-label="Compose a message"
            className={`absolute bottom-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gm-surface)] text-[var(--gm-blue)] shadow-[0_4px_18px_rgba(0,0,0,0.22)] transition-transform hover:scale-105 md:hidden ${focusRing}`}
          >
            <Glyph name="compose" size={20} />
          </button>
        ) : null}
      </div>

      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-3 left-3 z-30 max-w-[calc(100%-1.5rem)] rounded-md bg-[#323232] px-4 py-2 text-[0.75rem] font-medium text-white shadow-lg dark:bg-[#e3e3e3] dark:text-[#1f1f1f]"
        >
          {status}
        </div>
      ) : null}
    </div>
  );
}
