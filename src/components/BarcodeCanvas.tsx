import React from "react";
import { ZoomIn, ZoomOut, ArrowDownToLine, Loader2 } from "lucide-react";
import { PlateFrame } from "./PlateFrame";
import { HoloShimmer } from "./HoloShimmer";
import { CritterConfetti } from "./CritterConfetti";
import { ApprovalStamp } from "./ApprovalStamp";
import { LaminatorOverlay } from "./LaminatorOverlay";
import { StampCursor } from "./StampCursor";
import { ValidationIssue } from "../core/validation";
import { StateCritter } from "../core/stateCritters";
import { BarcodeDimension } from "../core/barcodeDimensions";

// Helper function from BarcodePreview.tsx
function isMissingRequiredError(message: string): boolean {
  return /^Missing mandatory fields/i.test(message);
}

interface BarcodeCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  stale: boolean;
  success: boolean;
  error: string | null;
  whimsy: boolean;
  state: string;
  critter: StateCritter;
  confettiKey: number;
  stampKey: number;
  laminateKey: number;
  onBingo?: (id: string) => void;
  emptyRequired: Array<{ code: string }>;
  issues: ValidationIssue[];
  scrollToField: (code: string) => void;
  dims: BarcodeDimension;
  exportDpi: number;
}

export const BarcodeCanvas: React.FC<BarcodeCanvasProps> = ({
  canvasRef,
  zoom,
  setZoom,
  stale,
  success,
  error,
  whimsy,
  state,
  critter,
  confettiKey,
  stampKey,
  laminateKey,
  onBingo,
  emptyRequired,
  issues,
  scrollToField,
  dims,
  exportDpi
}) => {
  return (
    <>
      <div className="printable-barcode relative min-h-[220px] overflow-auto rounded-md border border-gray-200 bg-white p-4 flex items-center justify-center barcode-zoom dark:border-dark-border dark:bg-gray-900">
        <PlateFrame state={state} enabled={whimsy && success}>
          <canvas
            ref={canvasRef}
            className={`max-w-full select-none origin-center transition-all duration-150 ${
              stale ? "opacity-40" : ""
            }`}
            style={{ transform: `scale(${zoom})` }}
            aria-busy={stale}
            aria-label="PDF417 barcode preview (pinch to zoom)"
          />
        </PlateFrame>
        {success && whimsy && <HoloShimmer state={state} enabled={whimsy} />}
        {success && (
          <CritterConfetti emoji={critter.emoji} fireKey={confettiKey} enabled={whimsy} />
        )}
        {success && <ApprovalStamp stampKey={stampKey} enabled={whimsy} />}
        {success && <LaminatorOverlay runKey={laminateKey} enabled={whimsy} />}
        {success && whimsy && <StampCursor enabled={whimsy} />}

        {/* Stale banner — the canvas below is one edit behind. */}
        {stale && !error && (
          <div
            role="status"
            className="absolute top-1.5 left-1.5 z-20 flex items-center gap-1 rounded bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 shadow-sm print:hidden"
          >
            <Loader2 size={10} className="animate-spin" aria-hidden />
            Updating…
          </div>
        )}

        {/* Zoom controls — complement native pinch-zoom with explicit buttons. */}
        {success && (
          <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center rounded-k border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm print:hidden dark:border-gray-700 dark:bg-gray-800/90">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
              disabled={zoom <= 0.5}
              aria-label="Zoom out"
              title="Zoom out"
              className="inline-flex h-k-touch w-k-touch items-center justify-center text-gray-700 hover:text-brand-700 disabled:opacity-40 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-l-k"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
              title="Reset zoom"
              className="inline-flex h-k-touch min-w-k-touch items-center justify-center px-2 font-mono text-k-help tabular-nums text-gray-700 hover:text-brand-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom((z) => {
                  const next = Math.min(3, Math.round((z + 0.25) * 100) / 100);
                  if (next >= 3) onBingo?.("zoomed-in");
                  return next;
                });
              }}
              disabled={zoom >= 3}
              aria-label="Zoom in"
              title="Zoom in"
              className="inline-flex h-k-touch w-k-touch items-center justify-center text-gray-700 hover:text-brand-700 disabled:opacity-40 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-r-k"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        )}

        {error && isMissingRequiredError(error) ? (
          <div
            role="status"
            className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 flex flex-col items-center justify-center p-4 text-center gap-2"
          >
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Fill the required fields to see the barcode
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Or load a sample profile from <span className="font-medium">Presets</span> in the
              header to see a generated barcode immediately.
            </p>
            <button
              type="button"
              onClick={() => {
                const code =
                  emptyRequired[0]?.code ?? issues.find((i) => i.severity === "error")?.code;
                if (code) scrollToField(code);
              }}
              disabled={emptyRequired.length === 0}
              className="mt-1 inline-flex h-k-touch min-h-k-touch shrink-0 items-center gap-1.5 rounded-k bg-brand-700 px-4 text-k-help font-bold text-white shadow-google transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ArrowDownToLine size={13} />
              {emptyRequired.length > 0
                ? `Fix ${emptyRequired.length} required field${emptyRequired.length === 1 ? "" : "s"}`
                : "Required fields ready"}
            </button>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="absolute inset-0 bg-red-50 dark:bg-red-900/60 bg-opacity-90 flex items-center justify-center p-3 text-center text-red-600 dark:text-red-300 text-sm font-semibold border border-red-200 dark:border-red-700 rounded-md"
          >
            {error}
          </div>
        ) : null}
      </div>

      {/* Printed-size readout */}
      <div className="-mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span title="Target printed size of the PDF417 area on the credential">
          Print size: {dims.widthInches}″ × {dims.heightInches}″ @ {exportDpi} DPI
        </span>
        {success && whimsy && (
          <span title={critter.name} aria-hidden>
            {critter.emoji} {state}
          </span>
        )}
      </div>
    </>
  );
};
