import React from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

export interface ModalShellOptions {
  open: boolean;
  onClose: () => void;
  /** Set false for modals that shouldn't close on Escape. Defaults to true. */
  closeOnEscape?: boolean;
}

/**
 * Focus management for a modal dialog: moves focus in on open, keeps Tab inside
 * the dialog while it is open, restores focus to the invoking element on close,
 * and wires Escape.
 *
 * Every modal in the app previously hand-rolled the first, third, and fourth of
 * those and none of them trapped Tab, so keyboard focus walked straight out of
 * the dialog into the page behind it — including the scanner, which held a live
 * camera stream and had no Escape handler at all.
 *
 * Returns a ref to spread onto the dialog container.
 */
export function useModalShell<T extends HTMLElement = HTMLDivElement>({
  open,
  onClose,
  closeOnEscape = true
}: ModalShellOptions): React.RefObject<T | null> {
  const containerRef = React.useRef<T | null>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const container = containerRef.current;
    const focusables = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    // Prefer an element the dialog marked as the entry point, then the first
    // focusable, then the container itself.
    const initial =
      container?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? container;
    initial?.focus?.();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        container?.focus?.();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      // Wrap at both ends, and pull focus back in if it has escaped entirely.
      if (e.shiftKey && (active === first || !container?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !container?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      const toRestore = restoreRef.current;
      // Defer so the dialog is out of the DOM before focus moves back.
      window.setTimeout(() => toRestore?.focus?.(), 0);
    };
  }, [open, onClose, closeOnEscape]);

  return containerRef;
}
