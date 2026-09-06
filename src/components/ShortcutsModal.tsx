import React from "react";
import { X, Keyboard } from "lucide-react";
import { useModalShell } from "../hooks/useModalShell";
import { detectPlatform, shortcutToken } from "../core/modKey";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  onReplayTour?: () => void;
}

interface Shortcut {
  /** "mod" and "shift" resolve to the platform's labels at render time. */
  keys: string[];
  description: string;
}

const SHORTCUTS: Array<{ category: string; entries: Shortcut[] }> = [
  {
    category: "Editing",
    entries: [
      { keys: ["mod", "Z"], description: "Undo last field change" },
      { keys: ["mod", "shift", "Z"], description: "Redo field change" },
      { keys: ["mod", "Y"], description: "Redo (alternate)" },
      { keys: ["mod", "G"], description: "Generate all auto fields (DCF, DAQ, DDB)" }
    ]
  },
  {
    category: "Import & Export",
    entries: [
      { keys: ["mod", "V"], description: "Paste an AAMVA payload or JSON profile into the form" },
      { keys: ["mod", "shift", "C"], description: "Copy raw payload to clipboard" },
      { keys: ["mod", "E"], description: "Export barcode as PNG" }
    ]
  },
  {
    category: "Navigation",
    entries: [
      { keys: ["mod", "K"], description: "Focus the field search box" },
      { keys: ["Esc"], description: "Clear the search, then the filters" },
      { keys: ["F8"], description: "Jump to the next validation issue" },
      { keys: ["shift", "F8"], description: "Jump to the previous validation issue" },
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

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose, onReplayTour }) => {
  const dialogRef = useModalShell<HTMLDivElement>({ open, onClose });
  // Resolved once per mount — the platform does not change mid-session.
  const platform = React.useMemo(() => detectPlatform(), []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-md bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="shortcuts-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <Keyboard size={16} />
            <span>Keyboard Shortcuts</span>
            <Key>?</Key>
          </h2>
          <button
            data-autofocus
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
                              <Key>{shortcutToken(k, platform)}</Key>
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
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Press <Key>Esc</Key> to close.
          </span>
          {onReplayTour && (
            <button
              type="button"
              onClick={onReplayTour}
              className="text-[11px] font-medium text-brand-700 dark:text-brand-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Replay welcome tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
