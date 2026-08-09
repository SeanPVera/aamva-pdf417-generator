import React, { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js";
import {
  FileImage,
  FileCode2,
  Check,
  ArrowDownToLine,
  Printer,
  Braces,
  Clipboard,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Maximize2,
  X,
  Volume2,
  Square,
  Loader2
} from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { getFieldsForStateAndVersion } from "../core/schema";
import { decodeAAMVA } from "../core/decoder";
import { getValidationIssues } from "../core/validation";
import {
  PDF417_ENCODER_OPTIONS,
  PREVIEW_SCALE,
  computeExportLayout,
  getBarcodeDimensions
} from "../core/barcodeDimensions";
import { buildExportBasename } from "../core/exportNaming";
import { getStateCritter } from "../core/stateCritters";
import { HoloShimmer } from "./HoloShimmer";
import { CritterConfetti } from "./CritterConfetti";
import { ApprovalStamp } from "./ApprovalStamp";
import { PlateFrame } from "./PlateFrame";
import { LaminatorOverlay } from "./LaminatorOverlay";
import { StampCursor } from "./StampCursor";
import { PayloadInspector } from "./PayloadInspector";
import { useModalShell } from "../hooks/useModalShell";
import { useClerkVoice, buildReadback } from "../hooks/useClerkVoice";

const EXPORT_DPI = 300;

const BWIP_OPTIONS = PDF417_ENCODER_OPTIONS;

// Heuristic — generator throws "Missing mandatory fields for STATE (vXX): …"
// when the user simply hasn't filled the form yet, which is the common empty
// state we want to soften.
function isMissingRequiredError(message: string): boolean {
  return /^Missing mandatory fields/i.test(message);
}

interface BarcodePreviewProps {
  mobileHidden?: boolean;
  onScrollToField?: (code: string) => void;
  whimsy?: boolean;
  /** Generated payload, owned by App so the shortcuts share one source. */
  payload: string;
  error: string | null;
  /** True while a re-encode is pending — the canvas below is one edit behind. */
  stale: boolean;
  /** Lets App drive the PNG export from the keyboard shortcut. */
  onRegisterExportPng?: (fn: (() => void) | null) => void;
  onExported?: () => void;
  onGenerated?: (clean: boolean) => void;
  onBingo?: (id: string) => void;
}

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({
  mobileHidden = false,
  onScrollToField,
  whimsy = true,
  payload,
  error,
  stale,
  onRegisterExportPng,
  onExported,
  onGenerated,
  onBingo
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, version, fields, strictMode, subfileType, includeNameInExport } = useFormStore();
  const setIncludeNameInExport = useFormStore((s) => s.setIncludeNameInExport);
  const inspectorWidth = useFormStore((s) => s.inspectorWidth);
  const setInspectorWidth = useFormStore((s) => s.setInspectorWidth);
  const [zoom, setZoom] = useState(1);
  const [confettiKey, setConfettiKey] = useState(0);
  const [stampKey, setStampKey] = useState(0);
  const [laminateKey, setLaminateKey] = useState(0);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [imgCopied, setImgCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const wasReadyRef = useRef(false);
  const wasValidRef = useRef(false);
  const voice = useClerkVoice();

  const payloadStr = payload;

  // Paint the canvas whenever a settled payload arrives.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payloadStr) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    try {
      bwipjs.toCanvas(canvas, { ...BWIP_OPTIONS, text: payloadStr });
    } catch {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [payloadStr]);

  const exportBasename = React.useCallback(
    (prefix: string) =>
      buildExportBasename({
        state,
        version,
        fields,
        subfileType,
        prefix,
        includeName: includeNameInExport
      }),
    [state, version, fields, subfileType, includeNameInExport]
  );

  const success = !!payloadStr && !error;
  // Exports are blocked while stale: the canvas and payload still hold the
  // previous result, and shipping that as current is the bug this closes.
  const canExport = success && !stale;

  const handleExportPNG = React.useCallback(() => {
    if (!canvasRef.current || error || !payloadStr || stale) return;

    const source = canvasRef.current;
    const { widthInches, heightInches } = getBarcodeDimensions(state);
    const targetWidth = Math.round(widthInches * EXPORT_DPI);
    const targetHeight = Math.round(heightInches * EXPORT_DPI);

    // The preview canvas is rendered at PREVIEW_SCALE px per module, so dividing
    // gives the symbol's module grid. Re-encode at the scale that fills the
    // credential's barcode area instead of resampling the screen-resolution
    // canvas — upscaling it by a fractional, per-axis factor made neighbouring
    // modules different pixel widths and collapsed the row-height : X-dimension
    // ratio below the 3:1 minimum PDF417 needs, which stops the print decoding.
    const layout = computeExportLayout(
      source.width / PREVIEW_SCALE,
      source.height / PREVIEW_SCALE,
      targetWidth,
      targetHeight
    );

    const target = document.createElement("canvas");
    target.width = targetWidth;
    target.height = targetHeight;
    const ctx = target.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    try {
      const printCanvas = document.createElement("canvas");
      bwipjs.toCanvas(printCanvas, {
        ...BWIP_OPTIONS,
        scale: layout.scale,
        text: payloadStr
      });
      ctx.drawImage(printCanvas, layout.offsetX, layout.offsetY);
    } catch {
      // Re-encoding failed for some reason — fall back to the preview canvas,
      // still scaled uniformly so the symbol stays undistorted.
      ctx.drawImage(
        source,
        0,
        0,
        source.width,
        source.height,
        layout.offsetX,
        layout.offsetY,
        layout.drawWidth,
        layout.drawHeight
      );
    }

    const url = target.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = exportBasename("barcode") + ".png";
    a.click();
    setLaminateKey((k) => k + 1);
    onExported?.();
    onBingo?.("exported-png");
  }, [error, payloadStr, stale, state, exportBasename, onExported, onBingo]);

  // Hand the exporter up so Ctrl/⌘+E can run it without scraping the DOM for a
  // button by aria-label.
  useEffect(() => {
    onRegisterExportPng?.(canExport ? handleExportPNG : null);
    return () => onRegisterExportPng?.(null);
  }, [onRegisterExportPng, handleExportPNG, canExport]);

  const handleExportSVG = () => {
    if (!payloadStr || error || stale) return;
    try {
      // bwip-js toSVG returns an SVG string
      const svgStr = (
        bwipjs as unknown as { toSVG: (opts: Record<string, unknown>) => string }
      ).toSVG({
        ...BWIP_OPTIONS,
        text: payloadStr
      });
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportBasename("barcode") + ".svg";
      a.click();
      URL.revokeObjectURL(url);
      setLaminateKey((k) => k + 1);
      onExported?.();
    } catch {
      // Fallback: wrap the canvas PNG in an SVG element
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const pngData = canvasRef.current.toDataURL("image/png");
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${pngData}" width="${w}" height="${h}"/></svg>`;
      const blob = new Blob([fallbackSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportBasename("barcode") + ".svg";
      a.click();
      URL.revokeObjectURL(url);
      onExported?.();
    }
  };

  const handlePrint = () => {
    if (!canvasRef.current || error || stale) return;
    document.documentElement.classList.add("printing-barcode");
    onBingo?.("printed");
    // Defer until layout settles so the print stylesheet applies cleanly.
    requestAnimationFrame(() => {
      window.print();
      // Some browsers (Chromium) fire afterprint asynchronously; clean up
      // either way so the class never lingers.
      const cleanup = () => {
        document.documentElement.classList.remove("printing-barcode");
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
      window.setTimeout(cleanup, 1500);
    });
  };

  const handleCopy = async () => {
    if (!payloadStr || stale) return;
    try {
      await navigator.clipboard.writeText(payloadStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy payload:", err);
    }
  };

  // Decoded output
  const decoded = payloadStr ? decodeAAMVA(payloadStr) : null;

  const handleCopyJson = async () => {
    if (!decoded?.json) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(decoded.json, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !canExport) return;
    const ClipboardItemCtor = (window as unknown as { ClipboardItem?: typeof ClipboardItem })
      .ClipboardItem;
    if (!ClipboardItemCtor || !navigator.clipboard?.write) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]);
      setImgCopied(true);
      onExported?.();
      setTimeout(() => setImgCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  };

  const canCopyImage =
    typeof window !== "undefined" && "ClipboardItem" in window && !!navigator.clipboard?.write;
  const decodedEntries: Array<[string, string]> = decoded?.json
    ? Object.entries(decoded.json).filter(([k]) => k !== "version" && k !== "state")
    : [];

  // Validation report
  const schemaFields = getFieldsForStateAndVersion(state, version);
  const issues = getValidationIssues(schemaFields, { ...fields, DAJ: state }, state, strictMode);
  const issueCount = issues.length;

  const emptyRequired = schemaFields.filter((f) => f.required && !(fields[f.code] || "").trim());
  const dims = getBarcodeDimensions(state);
  const critter = getStateCritter(state);

  // Fire the celebratory confetti on the rising edge of a successful render.
  useEffect(() => {
    if (success && !wasReadyRef.current) {
      wasReadyRef.current = true;
      onGenerated?.(issueCount === 0);
      if (whimsy) setTimeout(() => setConfettiKey((k) => k + 1), 0);
    } else if (!success) {
      wasReadyRef.current = false;
    }
    // `issueCount` is read for the badge signal but must not re-fire the burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, whimsy]);

  // Thunk the APPROVED stamp on the rising edge of a fully-valid payload.
  useEffect(() => {
    const valid = success && issueCount === 0;
    if (valid && !wasValidRef.current) {
      wasValidRef.current = true;
      if (whimsy) setTimeout(() => setStampKey((k) => k + 1), 0);
    } else if (!valid) {
      wasValidRef.current = false;
    }
  }, [success, issueCount, whimsy]);

  const scrollToField = (code: string) => {
    if (onScrollToField) {
      onScrollToField(code);
    } else {
      const el = document.getElementById(code);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.();
    }
  };

  // ── Draggable divider ───────────────────────────────────────────────────
  const draggingRef = useRef(false);
  const startDrag = (startX: number, startWidth: number) => {
    draggingRef.current = true;
    const onMove = (clientX: number) => {
      if (!draggingRef.current) return;
      // The panel is on the right, so dragging left widens it.
      setInspectorWidth(startWidth + (startX - clientX));
    };
    const onPointerMove = (e: PointerEvent) => onMove(e.clientX);
    const onPointerUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleDividerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setInspectorWidth(inspectorWidth + 24);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setInspectorWidth(inspectorWidth - 24);
    } else if (e.key === "Home") {
      e.preventDefault();
      setInspectorWidth(320);
    }
  };

  const inspector = (
    <PayloadInspector
      payloadStr={payloadStr}
      stale={stale}
      decodedEntries={decodedEntries}
      decodeError={decoded?.error}
      issues={issues}
      onScrollToField={(code) => {
        setExpanded(false);
        scrollToField(code);
      }}
      onCopyPayload={handleCopy}
      copied={copied}
    />
  );

  return (
    <>
      {/* Drag handle — desktop only; the mobile layout stacks panels. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the preview panel"
        aria-valuenow={inspectorWidth}
        aria-valuemin={280}
        aria-valuemax={720}
        tabIndex={0}
        onKeyDown={handleDividerKey}
        onPointerDown={(e) => {
          e.preventDefault();
          startDrag(e.clientX, inspectorWidth);
        }}
        onDoubleClick={() => setInspectorWidth(320)}
        title="Drag to resize · double-click to reset"
        className={`panel-divider hidden lg:block ${mobileHidden ? "" : ""}`}
      />

      <aside
        className={`dmv-preview w-full bg-gray-50 dark:bg-dark-surface border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-dark-border z-10 p-4 flex flex-col gap-4 shadow-sm overflow-y-auto shrink-0 ${
          mobileHidden ? "hidden lg:flex" : "flex"
        }`}
        style={{ ["--inspector-width" as string]: `${inspectorWidth}px` }}
        aria-label="Barcode preview and diagnostics"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100">
            Preview
          </h2>
          <div className="flex items-center gap-1.5">
            {strictMode && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                title="Strict compliance mode is on — warnings block generation."
              >
                <ShieldCheck size={11} /> Strict
              </span>
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="Expand the payload, decode, and validation views"
              aria-label="Expand inspector"
              className="p-1 rounded text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Canvas — wrapped in a pinch-zoomable scroller. The browser handles
            the gesture natively when `touch-action: pinch-zoom` is set. */}
        <div className="printable-barcode bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-border p-4 rounded-md flex items-center justify-center min-h-[150px] relative overflow-auto barcode-zoom">
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
            <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-md bg-white/85 dark:bg-gray-800/85 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm print:hidden">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                disabled={zoom <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-brand-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
                title="Reset zoom"
                className="px-1 text-[10px] font-mono tabular-nums text-gray-600 dark:text-gray-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
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
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-brand-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                <ZoomIn size={13} />
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
                className="mt-1 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
            Print size: {dims.widthInches}″ × {dims.heightInches}″ @ {EXPORT_DPI} DPI
          </span>
          {success && whimsy && (
            <span title={critter.name} aria-hidden>
              {critter.emoji} {state}
            </span>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExportPNG}
            disabled={!canExport}
            aria-label="Export barcode as PNG"
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded shadow text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
          >
            <FileImage size={14} />
            PNG
          </button>
          <button
            onClick={handleExportSVG}
            disabled={!canExport}
            aria-label="Export barcode as SVG"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 dark:bg-dark-surface2 dark:hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded shadow text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
          >
            <FileCode2 size={14} />
            SVG
          </button>
          <button
            onClick={handlePrint}
            disabled={!canExport}
            aria-label="Print barcode"
            title="Open the print dialog with just the barcode visible"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-dark-surface2 hover:bg-gray-200 dark:hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 dark:text-gray-100 py-1.5 rounded shadow text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
          >
            <Printer size={14} />
            Print
          </button>
        </div>

        {/* Filename privacy control. Off by default: a download filename is the
            one place a field value would leave the tab. */}
        <label className="-mt-2 flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeNameInExport}
            onChange={(e) => setIncludeNameInExport(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-[#555] dark:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          <span>
            Put the cardholder&apos;s name in export filenames
            <span className="block text-gray-400 dark:text-gray-500">
              Off: <span className="font-mono">{exportBasename("barcode")}.png</span>
            </span>
          </span>
        </label>

        {/* Secondary copy actions */}
        <div className="-mt-1 flex gap-2">
          {canCopyImage && (
            <button
              onClick={handleCopyImage}
              disabled={!canExport}
              aria-label="Copy barcode image to clipboard"
              title="Copy the barcode PNG to the clipboard"
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-dark-surface2 hover:bg-gray-200 dark:hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 py-1.5 rounded text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {imgCopied ? <Check size={13} className="text-green-500" /> : <Clipboard size={13} />}
              {imgCopied ? "Copied!" : "Copy image"}
            </button>
          )}
          <button
            onClick={handleCopyJson}
            disabled={!decoded?.json || stale}
            aria-label="Copy decoded payload as JSON"
            title="Copy the decoded payload as structured JSON"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-dark-surface2 hover:bg-gray-200 dark:hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 py-1.5 rounded text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {jsonCopied ? <Check size={13} className="text-green-500" /> : <Braces size={13} />}
            {jsonCopied ? "Copied!" : "Copy JSON"}
          </button>
        </div>

        {/* Read it back to me — proofreading by ear. */}
        {whimsy && voice.supported && decoded?.json && (
          <button
            type="button"
            onClick={() =>
              voice.speaking ? voice.stop() : voice.speak(buildReadback(decoded.json ?? {}))
            }
            className="-mt-2 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-dark-surface2 hover:bg-gray-200 dark:hover:bg-[#383838] text-gray-700 dark:text-gray-200 py-1.5 rounded text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Have the clerk read the payload back to you"
          >
            {voice.speaking ? <Square size={13} /> : <Volume2 size={13} />}
            {voice.speaking ? "Stop reading" : "Read it back to me"}
          </button>
        )}

        {inspector}
      </aside>

      {expanded && <InspectorModal onClose={() => setExpanded(false)}>{inspector}</InspectorModal>}
    </>
  );
};

const InspectorModal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose,
  children
}) => {
  const dialogRef = useModalShell<HTMLDivElement>({ open: true, onClose });
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        className="w-full max-w-4xl bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="inspector-title"
            className="text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            Payload Inspector
          </h2>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">{children}</div>
      </div>
    </div>
  );
};
