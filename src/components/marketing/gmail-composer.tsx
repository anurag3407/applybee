"use client";

import type { RefObject } from "react";
import { Glyph } from "./gmail-glyphs";
import type { ComposerState } from "./gmail-data";

type ComposerProps = {
  state: ComposerState;
  error: string | null;
  onPatch: (patch: Partial<ComposerState>) => void;
  onSend: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onExpand: () => void;
  onDiscard: () => void;
  onRemoveRecipient: () => void;
  toRef: RefObject<HTMLInputElement | null>;
  subjectRef: RefObject<HTMLInputElement | null>;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  minimizedRef: RefObject<HTMLButtonElement | null>;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gm-blue)]";

const iconButton = `flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[var(--gm-hover)] ${focusRing}`;

export function Composer({
  state,
  error,
  onPatch,
  onSend,
  onClose,
  onMinimize,
  onRestore,
  onExpand,
  onDiscard,
  onRemoveRecipient,
  toRef,
  subjectRef,
  bodyRef,
  minimizedRef,
}: ComposerProps) {
  if (state.mode === "closed") return null;

  if (state.mode === "minimized") {
    return (
      <div
        role="region"
        aria-label="Minimized compose"
        className="absolute bottom-0 right-0 z-20 flex h-11 w-full items-center overflow-hidden rounded-t-[0.75rem] border border-b-0 border-[var(--gm-rule)] bg-[var(--gm-surface)] shadow-[0_-2px_18px_rgba(0,0,0,0.16)] sm:w-[24rem]"
      >
        <button
          ref={minimizedRef}
          type="button"
          onClick={onRestore}
          aria-label={`Restore compose: ${state.subject.trim() || "New Message"}`}
          className={`min-w-0 flex-1 truncate px-4 py-2.5 text-left text-[0.8125rem] font-medium text-[var(--gm-text)] hover:bg-[var(--gm-hover)] ${focusRing}`}
        >
          {state.subject.trim() || "New Message"}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close compose and save draft"
          className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--gm-muted)] hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] ${focusRing}`}
        >
          <Glyph name="close" size={14} />
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="Compose message"
      className={
        state.expanded
          ? "absolute inset-0 z-20 flex flex-col overflow-hidden bg-[var(--gm-surface)] shadow-2xl"
          : "absolute bottom-0 right-0 z-20 flex h-[22rem] w-full flex-col overflow-hidden rounded-t-[0.75rem] border border-b-0 border-[var(--gm-rule)] bg-[var(--gm-surface)] shadow-[0_-2px_18px_rgba(0,0,0,0.16)] sm:w-[24rem]"
      }
    >
      <div className="flex h-10 shrink-0 items-center justify-between px-4">
        <span className="text-[0.8125rem] font-medium text-[var(--gm-text)]">New Message</span>
        <div className="flex items-center gap-1.5 text-[var(--gm-muted)]">
          <button type="button" onClick={onMinimize} aria-label="Minimize compose" className={iconButton}>
            <Glyph name="minimize" size={14} />
          </button>
          <button
            type="button"
            onClick={onExpand}
            aria-label={state.expanded ? "Restore compose size" : "Maximize compose"}
            aria-pressed={state.expanded}
            className={iconButton}
          >
            <Glyph name={state.expanded ? "collapse" : "expand"} size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close compose and save draft"
            className={iconButton}
          >
            <Glyph name="close" size={14} />
          </button>
        </div>
      </div>

      <div className="flex min-h-[38px] shrink-0 flex-wrap items-center gap-2 border-b border-[var(--gm-rule)] px-4 pb-2 text-[0.8125rem]">
        <label htmlFor="gmail-to" className="shrink-0 text-[var(--gm-muted)]">
          To
        </label>
        <div className="flex min-w-0 max-w-[70%] items-center rounded-full bg-[var(--gm-selected)] pl-2.5 pr-1 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--gm-blue)]">
          <input
            ref={toRef}
            id="gmail-to"
            type="text"
            value={state.to}
            onChange={(event) => onPatch({ to: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                subjectRef.current?.focus();
              }
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "gmail-to-error" : undefined}
            placeholder="Recipient"
            autoComplete="off"
            className="min-w-0 bg-transparent py-0.5 text-[16px] leading-5 text-[var(--gm-text)] outline-none placeholder:text-[var(--gm-muted)] sm:text-[0.75rem]"
            style={{ width: `${Math.min(30, Math.max(9, state.to.length))}ch` }}
          />
          {state.to ? (
            <button
              type="button"
              onClick={onRemoveRecipient}
              aria-label="Remove recipient"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--gm-muted)] hover:bg-black/10 hover:text-[var(--gm-text)] ${focusRing}`}
            >
              <Glyph name="close" size={10} />
            </button>
          ) : null}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 text-[0.75rem] text-[var(--gm-muted)]">
          <button
            type="button"
            onClick={() => onPatch({ showCc: !state.showCc })}
            aria-expanded={state.showCc}
            className={`rounded-sm px-1 py-0.5 hover:text-[var(--gm-text)] ${focusRing}`}
          >
            Cc
          </button>
          <button
            type="button"
            onClick={() => onPatch({ showCc: !state.showCc })}
            aria-expanded={state.showCc}
            className={`rounded-sm px-1 py-0.5 hover:text-[var(--gm-text)] ${focusRing}`}
          >
            Bcc
          </button>
        </div>
      </div>

      {error ? (
        <p id="gmail-to-error" role="alert" className="shrink-0 px-4 pb-1.5 pt-1 text-[0.6875rem] text-[var(--ab-danger)]">
          {error}
        </p>
      ) : null}

      {state.showCc ? (
        <div className="flex shrink-0 flex-col gap-1 border-b border-[var(--gm-rule)] px-4 py-2 text-[0.75rem] sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="gmail-cc" className="w-6 shrink-0 text-[var(--gm-muted)]">
              Cc
            </label>
            <input
              id="gmail-cc"
              type="text"
              value={state.cc}
              onChange={(event) => onPatch({ cc: event.target.value })}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--gm-text)] outline-none sm:text-[0.75rem]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="gmail-bcc" className="w-7 shrink-0 text-[var(--gm-muted)]">
              Bcc
            </label>
            <input
              id="gmail-bcc"
              type="text"
              value={state.bcc}
              onChange={(event) => onPatch({ bcc: event.target.value })}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--gm-text)] outline-none sm:text-[0.75rem]"
            />
          </div>
        </div>
      ) : null}

      <div className="shrink-0 border-b border-[var(--gm-rule)] px-4 py-1.5">
        <label htmlFor="gmail-subject" className="sr-only">
          Subject
        </label>
        <input
          ref={subjectRef}
          id="gmail-subject"
          type="text"
          value={state.subject}
          onChange={(event) => onPatch({ subject: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              bodyRef.current?.focus();
            }
          }}
          placeholder="Subject"
          autoComplete="off"
          className="w-full bg-transparent py-0.5 text-[16px] leading-6 text-[var(--gm-text)] outline-none placeholder:text-[var(--gm-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gm-blue)] sm:text-[0.8125rem]"
        />
      </div>

      <div className="min-h-0 flex-1 px-4 py-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--gm-blue)]/50">
        <label htmlFor="gmail-body" className="sr-only">
          Message body
        </label>
        <textarea
          ref={bodyRef}
          id="gmail-body"
          value={state.body}
          onChange={(event) => onPatch({ body: event.target.value })}
          placeholder="Write your message"
          className="h-full w-full resize-none bg-transparent text-[16px] leading-[1.65] text-[var(--gm-text)] outline-none placeholder:text-[var(--gm-muted)] sm:text-[0.8125rem]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1 border-t border-[var(--gm-rule)] px-2.5 py-1.5 text-[var(--gm-muted)]">
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-semibold">
          A
        </span>
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full">
          <Glyph name="paperclip" size={15} />
        </span>
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full">
          <Glyph name="link" size={15} />
        </span>
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full">
          <Glyph name="emoji" size={15} />
        </span>
        <span aria-hidden className="hidden h-7 w-7 items-center justify-center rounded-full sm:flex">
          <Glyph name="image" size={15} />
        </span>
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full">
          <Glyph name="more" size={15} />
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            aria-label="Discard draft"
            className={`flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--gm-hover)] hover:text-[var(--gm-text)] ${focusRing}`}
          >
            <Glyph name="trash" size={15} />
          </button>
          <button
            type="button"
            onClick={onSend}
            aria-label="Send demo message"
            className="flex items-stretch overflow-hidden rounded-full bg-[var(--gm-blue)] text-[0.75rem] font-medium text-[var(--gm-on-blue)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gm-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gm-surface)]"
          >
            <span className="py-1.5 pl-4 pr-2.5">Send</span>
            <span aria-hidden className="my-1 w-px bg-[var(--gm-on-blue)]/30" />
            <span aria-hidden className="flex items-center pl-2 pr-3">
              <Glyph name="chevron" size={12} />
            </span>
          </button>
        </span>
      </div>
    </section>
  );
}
