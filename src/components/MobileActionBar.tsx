import React from "react";
import { AlertCircle, FileImage, Loader2, PencilLine } from "lucide-react";

interface MobileActionBarProps {
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
 * A status-and-action strip pinned to the bottom of the mobile layout.
 *
 * On phones the three panels are mutually exclusive, so the form gives no sign
 * of whether the barcode is ready and the export buttons live one tab away.
 * This puts the answer and the button in the same place, above the home
 * indicator, without touching the desktop layout.
 */
export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  errorCount,
  emptyRequired,
  stale,
  ready,
  onFixNext,
  onExport
}) => {
  const blocked = errorCount > 0 || emptyRequired > 0;

  return (
    <div className="mobile-action-bar lg:hidden" role="region" aria-label="Barcode status">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium">
          {stale ? (
            <>
              <Loader2 size={13} className="shrink-0 animate-spin text-gray-400" aria-hidden />
              <span className="truncate text-gray-500 dark:text-gray-400">Encoding…</span>
            </>
          ) : errorCount > 0 ? (
            <>
              <AlertCircle size={13} className="shrink-0 text-red-500" aria-hidden />
              <span className="truncate text-red-600 dark:text-red-400">
                {errorCount} error{errorCount === 1 ? "" : "s"}
              </span>
            </>
          ) : emptyRequired > 0 ? (
            <>
              <PencilLine size={13} className="shrink-0 text-amber-500" aria-hidden />
              <span className="truncate text-amber-700 dark:text-amber-400">
                {emptyRequired} required field{emptyRequired === 1 ? "" : "s"} left
              </span>
            </>
          ) : ready ? (
            <span className="truncate text-green-700 dark:text-green-400">Barcode ready</span>
          ) : (
            <span className="truncate text-gray-500 dark:text-gray-400">
              Fill the form to start
            </span>
          )}
        </span>

        {blocked ? (
          <button
            type="button"
            onClick={onFixNext}
            className="shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-dark-surface2 dark:text-gray-100 dark:hover:bg-[#383838]"
          >
            {errorCount > 0 ? "Fix next" : "Next field"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onExport}
            disabled={!ready || stale}
            // Distinct from the preview panel's "Export barcode as PNG": both
            // are in the DOM at mobile widths, and two controls answering to
            // one name is ambiguous to anyone navigating by accessible name.
            aria-label="Quick export barcode as PNG"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <FileImage size={13} aria-hidden />
            PNG
          </button>
        )}
      </div>
    </div>
  );
};
