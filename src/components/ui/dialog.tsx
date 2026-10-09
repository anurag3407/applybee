"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "@/components/svg/icons";
import { cn } from "@/lib/cn";

/**
 * Dialog (§8.4): focus trap, Escape, explicit cancel, return focus.
 * 160–200 ms appearance max; no spatial theatrics.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      dialog.showModal();
      const first = dialog.querySelector<HTMLElement>("input, textarea, select, button");
      first?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      previouslyFocused.current?.focus();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dialog.open) {
        e.preventDefault();
        handleClose();
      }
      if (e.key === "Tab" && dialog.open) {
        // Minimal focus trap.
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "ab-dialog m-auto w-[min(92vw,34rem)] rounded-card border border-border-decorative bg-surface p-0 shadow-dialog",
        "backdrop:bg-veil backdrop:backdrop-blur-[2px]",
        wide && "w-[min(94vw,46rem)]",
      )}
    >
      <div className="flex items-center justify-between border-b border-border-decorative px-5 py-4">
        <h2 id="dialog-title" className="text-lg font-bold text-ink">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="ab-press rounded-control p-1.5 text-text-secondary hover:bg-surface-subtle hover:text-ink"
        >
          <IconClose size={18} />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="flex justify-end gap-2 border-t border-border-decorative px-5 py-3">{footer}</div> : null}
    </dialog>
  );
}
