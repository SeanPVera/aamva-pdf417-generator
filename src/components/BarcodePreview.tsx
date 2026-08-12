import React, { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js";
import { ShieldCheck, Maximize2 } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { getFieldsForStateAndVersion } from "../core/schema";
import { decodeAAMVA } from "../core/decoder";
import { getValidationIssues } from "../core/validation";
import { getQuickFixes, type QuickFix } from "../core/quickFix";
import {
  PDF417_ENCODER_OPTIONS,
  PREVIEW_SCALE,
  computeExportLayout,
  getBarcodeDimensions
} from "../core/barcodeDimensions";
import { buildExportBasename } from "../core/exportNaming";
import { downloadBlob, downloadUrl } from "../core/download";
import { getStateCritter } from "../core/stateCritters";
import { PayloadInspector } from "./PayloadInspector";
import { InspectorModal } from "./InspectorModal";
import { BarcodeCanvas } from "./BarcodeCanvas";
import { PreviewActions } from "./PreviewActions";
import { useClerkVoice } from "../hooks/useClerkVoice";

const EXPORT_DPI = 300;

const BWIP_OPTIONS = PDF417_ENCODER_OPTIONS;

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
  const setField = useFormStore((s) => s.setField);
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

    downloadUrl(target.toDataURL("image/png"), exportBasename("barcode") + ".png");
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
      downloadBlob(
        new Blob([svgStr], { type: "image/svg+xml" }),
        exportBasename("barcode") + ".svg"
      );
      setLaminateKey((k) => k + 1);
      onExported?.();
    } catch {
      // Fallback: wrap the canvas PNG in an SVG element
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const pngData = canvasRef.current.toDataURL("image/png");
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${pngData}" width="${w}" height="${h}"/></svg>`;
      downloadBlob(
        new Blob([fallbackSvg], { type: "image/svg+xml" }),
        exportBasename("barcode") + ".svg"
      );
      onExported?.();
    }
  };

  // A PDF at the credential's real physical size — what you hand to a print
  // shop. jsPDF is ~150 kB, so it is only fetched when the button is pressed;
  // PNG and SVG exports never pay for it.
  const handleExportPDF = React.useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !payloadStr || error || stale) return;
    try {
      const { jsPDF } = await import("jspdf");
      const { widthInches, heightInches } = getBarcodeDimensions(state);
      const margin = 36; // half an inch, in points
      const width = widthInches * 72;
      const height = heightInches * 72;

      const printCanvas = document.createElement("canvas");
      // Re-encode rather than upscaling the preview: a fractional resample
      // makes neighbouring modules different widths and stops the print
      // decoding (same reasoning as the PNG path above).
      bwipjs.toCanvas(printCanvas, {
        ...BWIP_OPTIONS,
        scale: Math.max(1, Math.round((widthInches * EXPORT_DPI) / (canvas.width / PREVIEW_SCALE))),
        text: payloadStr
      });

      const pdf = new jsPDF({ unit: "pt", format: "letter" });
      pdf.setFontSize(9);
      pdf.text(`${state} · AAMVA v${version} · ${subfileType}`, margin, margin);
      pdf.addImage(
        printCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin + 12,
        width,
        height,
        undefined,
        "NONE"
      );
      pdf.setFontSize(7);
      pdf.text(
        `${widthInches.toFixed(2)}in x ${heightInches.toFixed(2)}in at ${EXPORT_DPI} DPI — print at 100% scale`,
        margin,
        margin + 26 + height
      );
      pdf.save(exportBasename("barcode") + ".pdf");
      setLaminateKey((k) => k + 1);
      onExported?.();
    } catch (err) {
      console.error("Failed to export PDF:", err);
    }
  }, [payloadStr, error, stale, state, version, subfileType, exportBasename, onExported]);

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

  // Deterministic repairs for whatever the validator is complaining about, plus
  // the tidy-ups the encoder would silently apply anyway. Each was already
  // checked against the validator inside getQuickFixes, so "Fix all" cannot
  // leave the form worse than it found it.
  const fixes = React.useMemo(
    () => getQuickFixes(schemaFields, fields, state, strictMode),
    [schemaFields, fields, state, strictMode]
  );
  const applyFix = React.useCallback((fix: QuickFix) => setField(fix.code, fix.value), [setField]);
  const applyAllFixes = React.useCallback(() => {
    for (const fix of fixes) setField(fix.code, fix.value);
  }, [fixes, setField]);
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
      fixes={fixes}
      onApplyFix={applyFix}
      onApplyAllFixes={applyAllFixes}
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

        <BarcodeCanvas
          canvasRef={canvasRef}
          zoom={zoom}
          setZoom={setZoom}
          stale={stale}
          success={success}
          error={error}
          whimsy={whimsy}
          state={state}
          critter={critter}
          confettiKey={confettiKey}
          stampKey={stampKey}
          laminateKey={laminateKey}
          onBingo={onBingo}
          emptyRequired={emptyRequired}
          issues={issues}
          scrollToField={scrollToField}
          dims={dims}
          exportDpi={EXPORT_DPI}
        />

        <PreviewActions
          canExport={canExport}
          handleExportPNG={handleExportPNG}
          handleExportSVG={handleExportSVG}
          handleExportPDF={handleExportPDF}
          handlePrint={handlePrint}
          includeNameInExport={includeNameInExport}
          setIncludeNameInExport={setIncludeNameInExport}
          exportBasename={exportBasename}
          canCopyImage={canCopyImage}
          handleCopyImage={handleCopyImage}
          imgCopied={imgCopied}
          handleCopyJson={handleCopyJson}
          jsonCopied={jsonCopied}
          decoded={decoded}
          stale={stale}
          whimsy={whimsy}
          voice={voice}
        />

        {inspector}
      </aside>

      {expanded && <InspectorModal onClose={() => setExpanded(false)}>{inspector}</InspectorModal>}
    </>
  );
};
