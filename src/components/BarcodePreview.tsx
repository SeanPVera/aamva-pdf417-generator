import React, { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js";
import { Maximize2 } from "lucide-react";
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
import { PayloadInspector } from "./PayloadInspector";
import { InspectorModal } from "./InspectorModal";
import { BarcodeCanvas } from "./BarcodeCanvas";
import { PreviewActions } from "./PreviewActions";
import { useClerkVoice } from "../hooks/useClerkVoice";
import { useToast } from "./Toast";

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
  onBingo?: (id: string) => void;
}

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({
  mobileHidden = false,
  onScrollToField,
  whimsy = false,
  payload,
  error,
  stale,
  onRegisterExportPng,
  onExported,
  onBingo
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, version, fields, strictMode, subfileType, includeNameInExport } = useFormStore();
  const setField = useFormStore((s) => s.setField);
  const mergeFields = useFormStore((s) => s.mergeFields);
  const setIncludeNameInExport = useFormStore((s) => s.setIncludeNameInExport);
  const inspectorWidth = useFormStore((s) => s.inspectorWidth);
  const sourcePayload = useFormStore((s) => s.sourcePayload);
  const setInspectorWidth = useFormStore((s) => s.setInspectorWidth);
  const [zoom, setZoom] = useState(1);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [imgCopied, setImgCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const voice = useClerkVoice();
  const toast = useToast();

  const payloadStr = payload;
  const [renderResult, setRenderResult] = useState<{ payload: string; error: string | null }>({
    payload: "",
    error: null
  });

  // Paint the canvas whenever a settled payload arrives.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!payloadStr) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setRenderResult({ payload: "", error: null });
        return;
      }
      try {
        bwipjs.toCanvas(canvas, { ...BWIP_OPTIONS, text: payloadStr });
        setRenderResult({ payload: payloadStr, error: null });
      } catch {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setRenderResult({
          payload: payloadStr,
          error:
            "Could not render PDF417. The payload may exceed symbol capacity. Reduce the record before exporting."
        });
      }
    });
    return () => cancelAnimationFrame(frame);
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

  const renderError = renderResult.payload === payloadStr ? renderResult.error : null;
  const success = !!payloadStr && !error && !renderError && renderResult.payload === payloadStr;
  // Exports are blocked while stale: the canvas and payload still hold the
  // previous result, and shipping that as current is the bug this closes.
  const canExport = success && !stale;

  const handleExportPNG = React.useCallback(() => {
    const source = canvasRef.current;
    if (!source || !canExport) return;
    try {
      const { widthInches, heightInches } = getBarcodeDimensions(state);
      const targetWidth = Math.round(widthInches * EXPORT_DPI);
      const targetHeight = Math.round(heightInches * EXPORT_DPI);
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
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      const printCanvas = document.createElement("canvas");
      bwipjs.toCanvas(printCanvas, { ...BWIP_OPTIONS, scale: layout.scale, text: payloadStr });
      ctx.drawImage(printCanvas, layout.offsetX, layout.offsetY);
      downloadUrl(target.toDataURL("image/png"), exportBasename("barcode") + ".png");
      onExported?.();
      onBingo?.("exported-png");
    } catch {
      toast.error(
        "Could not export PNG. The symbol must fit the print preset and render successfully. Try SVG for a larger symbol."
      );
    }
  }, [canExport, state, payloadStr, exportBasename, onExported, onBingo, toast]);

  // Hand the exporter up so Ctrl/⌘+E can run it without scraping the DOM for a
  // button by aria-label.
  useEffect(() => {
    onRegisterExportPng?.(canExport ? handleExportPNG : null);
    return () => onRegisterExportPng?.(null);
  }, [onRegisterExportPng, handleExportPNG, canExport]);

  const handleExportSVG = () => {
    if (!canExport) return;
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
      onExported?.();
    } catch {
      toast.error("Could not export SVG. No file was downloaded.");
    }
  };

  // A PDF at the credential's real physical size — what you hand to a print
  // shop. jsPDF is ~150 kB, so it is only fetched when the button is pressed;
  // PNG and SVG exports never pay for it.
  const handleExportPDF = React.useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !canExport) return;
    const before = useFormStore.getState();
    try {
      const { jsPDF } = await import("jspdf");
      const current = useFormStore.getState();
      if (
        current.fields !== before.fields ||
        current.state !== before.state ||
        current.version !== before.version ||
        current.subfileType !== before.subfileType
      ) {
        toast.info("The record changed while PDF export loaded. Export the current record again.");
        return;
      }
      const { widthInches, heightInches } = getBarcodeDimensions(state);
      const margin = 36; // half an inch, in points
      const height = heightInches * 72;

      // Same layout maths as the PNG path, and for the same reason: sizing the
      // image to the credential rectangle on both axes independently rescales
      // the module grid by a different factor horizontally and vertically,
      // which collapses the row-height : X-dimension ratio below the 3:1
      // minimum PDF417 needs and stops the print decoding. `computeExportLayout`
      // picks one integer scale for both axes and centres what is left over.
      const layout = computeExportLayout(
        canvas.width / PREVIEW_SCALE,
        canvas.height / PREVIEW_SCALE,
        Math.round(widthInches * EXPORT_DPI),
        Math.round(heightInches * EXPORT_DPI)
      );

      const printCanvas = document.createElement("canvas");
      // Re-encode rather than upscaling the preview: a fractional resample
      // makes neighbouring modules different widths (same reasoning as above).
      bwipjs.toCanvas(printCanvas, { ...BWIP_OPTIONS, scale: layout.scale, text: payloadStr });

      // Pixels at EXPORT_DPI → PDF points, so the symbol lands at its true
      // physical size inside the credential's barcode area.
      const pxToPt = 72 / EXPORT_DPI;

      const pdf = new jsPDF({ unit: "pt", format: "letter" });
      pdf.setFontSize(9);
      pdf.text(`${state} · AAMVA v${version} · ${subfileType}`, margin, margin);
      pdf.addImage(
        printCanvas.toDataURL("image/png"),
        "PNG",
        margin + layout.offsetX * pxToPt,
        margin + 12 + layout.offsetY * pxToPt,
        layout.drawWidth * pxToPt,
        layout.drawHeight * pxToPt,
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
      onExported?.();
    } catch {
      toast.error(
        "Could not export PDF. The symbol must fit the print preset and render successfully."
      );
    }
  }, [payloadStr, canExport, state, version, subfileType, exportBasename, onExported, toast]);

  const handlePrint = () => {
    if (!canvasRef.current || !canExport) return;
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

  const handleCopy = async (text = payloadStr) => {
    if (!text || (stale && text !== sourcePayload)) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied raw payload to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy payload. Check clipboard permission.");
    }
  };

  // Decoded output
  const decoded = React.useMemo(() => (payloadStr ? decodeAAMVA(payloadStr) : null), [payloadStr]);

  const handleCopyJson = async () => {
    if (!decoded?.json || stale) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(decoded.json, null, 2));
      setJsonCopied(true);
      toast.success("Copied decoded JSON to clipboard");
      setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      toast.error("Could not copy JSON. Check clipboard permission.");
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
      if (!blob) throw new Error("Canvas returned no image");
      await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]);
      setImgCopied(true);
      toast.success("Copied barcode image to clipboard");
      onExported?.();
      setTimeout(() => setImgCopied(false), 2000);
    } catch {
      toast.error("Could not copy image. Check clipboard permission.");
    }
  };

  const canCopyImage =
    typeof window !== "undefined" && "ClipboardItem" in window && !!navigator.clipboard?.write;
  const decodedEntries: Array<[string, string]> = decoded?.json
    ? Object.entries(decoded.json).filter(
        ([k]) => k !== "version" && k !== "state" && k !== "subfileType"
      )
    : [];

  // Validation report
  const schemaFields = getFieldsForStateAndVersion(state, version, subfileType);
  const issues = getValidationIssues(schemaFields, fields, state, strictMode, subfileType);

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
  // One button press, one undo step. Looping `setField` pushed a history entry
  // per fix (the codes differ, so nothing coalesces), which left Ctrl+Z undoing
  // the bulk action one field at a time through partially-fixed intermediates.
  const applyAllFixes = React.useCallback(() => {
    if (fixes.length === 0) return;
    mergeFields(Object.fromEntries(fixes.map((fix) => [fix.code, fix.value])));
  }, [fixes, mergeFields]);
  const dims = getBarcodeDimensions(state);

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
  const dragCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanupRef.current?.(), []);
  const startDrag = (startX: number, startWidth: number) => {
    draggingRef.current = true;
    const onMove = (clientX: number) => {
      if (!draggingRef.current) return;
      // The panel is on the right, so dragging left widens it.
      setInspectorWidth(Math.min(window.innerWidth * 0.42, startWidth + (startX - clientX)));
    };
    const onPointerMove = (e: PointerEvent) => onMove(e.clientX);
    const onPointerUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    dragCleanupRef.current?.();
    dragCleanupRef.current = onPointerUp;
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
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
      setInspectorWidth(440);
    }
  };

  const inspector = (
    <PayloadInspector
      payloadStr={payloadStr}
      stale={stale}
      decodedEntries={decodedEntries}
      sourcePayload={sourcePayload}
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
        onDoubleClick={() => setInspectorWidth(440)}
        title="Drag to resize · double-click to reset"
        className={`panel-divider hidden lg:block ${mobileHidden ? "" : ""}`}
      />

      <aside
        className={`output-panel ${mobileHidden ? "hidden lg:flex" : "flex"}`}
        style={{ ["--inspector-width" as string]: `${inspectorWidth}px` }}
        aria-label="Barcode preview and diagnostics"
      >
        <div className="output-heading">
          <h2>Output</h2>
          <div className="flex items-center gap-1.5">
            <span className="validation-mode">
              {strictMode ? "Strict validation" : "Standard validation"}
            </span>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="Expand the payload, decode, and validation views"
              aria-label="Expand inspector"
              className="inline-flex h-k-touch w-k-touch items-center justify-center rounded-k text-gray-600 hover:bg-gray-100 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-dark-surface2 dark:hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
          error={error || renderError}
          whimsy={whimsy}
          state={state}
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

        {Object.keys(fields).some(
          (code) => fields[code] && !schemaFields.some((f) => f.code === code)
        ) && (
          <p className="proof-note">
            Some stored fields are outside this schema and are omitted from this output. Review
            “fields outside this schema” in the editor.
          </p>
        )}
        {inspector}
      </aside>

      {expanded && <InspectorModal onClose={() => setExpanded(false)}>{inspector}</InspectorModal>}
    </>
  );
};
