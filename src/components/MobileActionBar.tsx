import React from "react";
import {
  AlertCircle,
  FileImage,
  Loader2,
  PencilLine,
  Settings2,
  List,
  ScanLine
} from "lucide-react";

type MobilePanel = "config" | "form" | "preview";

interface MobileActionBarProps {
  panel: MobilePanel;
  onPanelChange: (panel: MobilePanel) => void;
  /** Errors currently blocking generation. */
  errorCount: number;
  /** Required fields still empty. */
  emptyRequired: number;
  /** True while the payload is being re-encoded. */
  stale: boolean;
  /** True when a barcode is on screen and exportable. */
  ready: boolean;
  onFixNext: () => void;
  onExport: () => void;
}

/**
 * Bottom kiosk chrome on phones: panel switcher plus the next action.
 *
 * The three panels used to live in a 48px tab row *above* the form, on top of
 * the header, the step strip and the filter bar — that stack is what left the
 * first input at 51% of an 844px screen. Putting the tabs here (where thumbs
 * already are) is the remaining half of direction D.
 */
export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  panel,
  onPanelChange,
  errorCount,
  emptyRequired,
  stale,
  ready,
  onFixNext,
  onExport
}) => {
  const blocked = errorCount > 0 || emptyRequired > 0;

  const tabs: Array<{ key: MobilePanel; label: string; icon: React.ReactNode; badge?: string }> = [
    { key: "config", label: "Setup", icon: <Settings2 size={16} aria-hidden /> },
    {
      key: "form",
      label: "Form",
      icon: <List size={16} aria-hidden />,
      badge: errorCount > 0 ? (errorCount > 9 ? "9+" : String(errorCount)) : undefined
    },
    {
      key: "preview",
      label: "Barcode",
      icon: <ScanLine size={16} aria-hidden />,
      badge: ready && !blocked ? "✓" : undefined
    }
  ];

  return (
    <div className="mobile-action-bar lg:hidden" role="region" aria-label="Kiosk navigation">
      <div className="flex items-center gap-2 px-2 py-2">
        <nav aria-label="Mobile panels" className="grid min-w-0 flex-1 grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onPanelChange(tab.key)}
              aria-current={panel === tab.key ? "page" : undefined}
              className={`relative inline-flex h-k-touch items-center justify-center gap-1 rounded-k px-1 text-k-help font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                panel === tab.key
                  ? "state-primary-bg text-white"
                  : "bg-gray-100 text-gray-800 dark:bg-dark-surface2 dark:text-gray-100"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`absolute -right-0.5 -top-0.5 min-w-4 rounded-full px-1 text-[10px] leading-4 ${
                    tab.key === "form" && errorCount > 0
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {blocked ? (
          <button
            type="button"
            onClick={onFixNext}
            className="inline-flex h-k-touch shrink-0 items-center gap-1.5 rounded-k bg-gray-900 px-3 text-k-help font-bold text-white dark:bg-gray-100 dark:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {errorCount > 0 ? (
              <>
                <AlertCircle size={15} aria-hidden />
                Fix
              </>
            ) : (
              <>
                <PencilLine size={15} aria-hidden />
                Next
              </>
            )}
          </button>
        ) : stale ? (
          <span className="inline-flex h-k-touch shrink-0 items-center gap-1.5 px-2 text-k-help text-gray-500">
            <Loader2 size={15} className="animate-spin" aria-hidden />
            Encoding
          </span>
        ) : (
          <button
            type="button"
            onClick={onExport}
            disabled={!ready || stale}
            aria-label="Quick export barcode as PNG"
            className="inline-flex h-k-touch shrink-0 items-center gap-1.5 rounded-k bg-brand-700 px-3 text-k-help font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <FileImage size={15} aria-hidden />
            PNG
          </button>
        )}
      </div>
    </div>
  );
};
