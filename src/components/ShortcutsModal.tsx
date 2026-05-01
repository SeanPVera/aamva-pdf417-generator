import React, { useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Array<{ category: string; entries: Shortcut[] }> = [
  {
    category: "Editing",
    entries: [
      { keys: ["Ctrl", "Z"], description: "Undo last field change" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo field change" },
      { keys: ["Ctrl", "Y"], description: "Redo (alternate)" }
    ]
  },
  {
    category: "Navigation",
    entries: [
      { keys: ["?"], description: "Open this shortcuts cheat sheet" },
      { keys: ["Esc"], description: "Close any open modal" },
      { keys: ["Tab"], description: "Move focus to the next field" }
    ]
  }
];

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-200 shadow-sm">
      {children}
    </kbd>
  );
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="shortcuts-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <Keyboard size={16} />
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {SHORTCUTS.map((group) => (
            <section key={group.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {group.category}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {group.entries.map((s) => (
                    <tr
                      key={s.description}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <td className="py-1.5 pr-4">
                        <span className="inline-flex items-center gap-1">
                          {s.keys.map((k, i) => (
                            <React.Fragment key={`${k}-${i}`}>
                              {i > 0 && <span className="text-gray-400">+</span>}
                              <Key>{k}</Key>
                            </React.Fragment>
                          ))}
                        </span>
                      </td>
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <div className="px-4 pb-3 text-[11px] text-gray-500 dark:text-gray-400">
          Press <Key>Esc</Key> to close.
        </div>
      </div>
    </div>
  );
};
