import React from "react";
import type { ValidationIssue } from "../core/validation";
import type { BarcodeDimension } from "../core/barcodeDimensions";
interface BarcodeCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  stale: boolean;
  success: boolean;
  error: string | null;
  whimsy: boolean;
  state: string;
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
  emptyRequired,
  issues,
  scrollToField,
  dims,
  exportDpi
}) => {
  const missing = !!error && /^Missing mandatory fields/i.test(error);
  const first =
    issues.find((i) => i.severity === "error" && i.kind !== "empty")?.code ??
    emptyRequired[0]?.code;
  return (
    <>
      <div className="barcode-proof">
        <div className="proof-caption">
          <span>PDF417 / PROOF</span>
          <span>{stale ? "UPDATING" : success ? "ENCODED" : "AWAITING RECORD"}</span>
        </div>
        <div
          className="printable-barcode"
          style={{ ["--print-width" as string]: `${dims.widthInches}in` }}
        >
          <canvas
            ref={canvasRef}
            aria-label="PDF417 barcode preview"
            aria-busy={stale}
            style={{
              display: success || stale ? "block" : "none",
              transform: `scale(${zoom})`,
              transformOrigin: "left center",
              opacity: stale ? 0.4 : 1
            }}
          />
          {!success && !stale && (
            <div className="proof-empty">
              <strong>
                {error && !missing ? "Output needs attention" : "A record becomes a symbol."}
              </strong>
              <p>
                {error && !missing
                  ? "Review the error below. Your input is preserved."
                  : "Complete the required fields to generate a PDF417 preview."}
              </p>
              {first && (
                <button className="text-button" onClick={() => scrollToField(first)}>
                  Go to {first} →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="proof-status" role="status">
        <span>
          {stale
            ? "Encoding current changes…"
            : success
              ? "Rendered · ready to export"
              : emptyRequired.length
                ? `${emptyRequired.length} required fields remaining`
                : "No rendered barcode"}
        </span>
        {success && (
          <div className="proof-status-controls">
            <button
              aria-label="Zoom out"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="Zoom in"
              disabled={zoom >= 3}
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            >
              +
            </button>
          </div>
        )}
      </div>
      {error && !missing && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <p className="proof-note">
        Print preset {dims.widthInches.toFixed(3)} × {dims.heightInches.toFixed(3)} in · {exportDpi}{" "}
        DPI. Physical scan reliability is not certified.
      </p>
    </>
  );
};
