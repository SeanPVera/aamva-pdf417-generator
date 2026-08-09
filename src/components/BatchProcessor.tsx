import React, { useRef, useState } from "react";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  FileDown,
  X,
  FileSpreadsheet,
  Archive,
  ListChecks
} from "lucide-react";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";
import { jsPDF } from "jspdf";
import bwipjs from "bwip-js";
import { PDF417_ENCODER_OPTIONS } from "../core/barcodeDimensions";
import { parseBatchTable, toCsv } from "../core/csv";
import { createZip, dataUrlToBytes } from "../core/zip";
import { useModalShell } from "../hooks/useModalShell";
import { useHoldMusic } from "../hooks/useHoldMusic";
import { useFormStore } from "../hooks/useFormStore";

const SAMPLE_BATCH = [
  {
    state: "CA",
    version: "10",
    subfileType: "DL",
    DCS: "DOE",
    DAC: "JANE",
    DAD: "Q",
    DBA: "01012029",
    DBB: "02151990",
    DBC: "2",
    DAY: "BRO",
    DAU: "067 IN",
    DAG: "123 SAMPLE ST",
    DAI: "SAN FRANCISCO",
    DAJ: "CA",
    DAK: "94110",
    DAQ: "D1234567",
    DCA: "C",
    DCB: "NONE",
    DCD: "NONE",
    DBD: "01012024",
    DCG: "USA",
    DDE: "N",
    DDF: "N",
    DDG: "N"
  },
  {
    state: "TX",
    version: "10",
    subfileType: "ID",
    DCS: "ROE",
    DAC: "JOHN",
    DBA: "06012028",
    DBB: "07201985",
    DBC: "1",
    DAY: "BLU",
    DAU: "071 IN",
    DAG: "456 EXAMPLE AVE",
    DAI: "AUSTIN",
    DAJ: "TX",
    DAK: "78701",
    DAQ: "12345678",
    DCA: "C",
    DCB: "NONE",
    DCD: "NONE",
    DBD: "06012023",
    DCG: "USA",
    DDE: "N",
    DDF: "N",
    DDG: "N"
  }
];

// Print resolution for the PDF export — the symbol is placed at a uniform
// scale, so modules stay square and the row-height : X-dimension ratio holds.
const BATCH_SCALE = 3;

/** Rows shown in the pre-flight preview before anything is generated. */
const PREVIEW_ROWS = 5;

interface BatchEntry {
  state: string;
  version: string;
  subfileType?: "DL" | "ID";
  [key: string]: string | undefined;
}

interface RowResult {
  row: number;
  state: string;
  version: string;
  subfileType: string;
  ok: boolean;
  error: string;
  /** PNG data URL for successful rows, used by the ZIP export. */
  png?: string;
}

/** Convert canvas pixels to PDF points (jsPDF default unit is pt, 72pt = 1in).
 *  We assume screen pixels at 96 DPI: 1px = 72/96 pt = 0.75 pt.
 *  Then we constrain to fit within the page content width. */
function canvasToPdfDimensions(
  canvasWidth: number,
  canvasHeight: number,
  maxWidthPt: number
): { widthPt: number; heightPt: number } {
  const ptPerPx = 72 / 96;
  const naturalWidthPt = canvasWidth * ptPerPx;
  const naturalHeightPt = canvasHeight * ptPerPx;

  if (naturalWidthPt <= maxWidthPt) {
    return { widthPt: naturalWidthPt, heightPt: naturalHeightPt };
  }

  const scale = maxWidthPt / naturalWidthPt;
  return { widthPt: maxWidthPt, heightPt: naturalHeightPt * scale };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface BatchProcessorProps {
  open: boolean;
  onClose: () => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ open, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<BatchEntry[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [unknownHeaders, setUnknownHeaders] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [strict, setStrict] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [rowResults, setRowResults] = useState<RowResult[] | null>(null);
  const [showExample, setShowExample] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useModalShell<HTMLDivElement>({ open, onClose, closeOnEscape: !processing });
  const recordBadgeEvent = useFormStore((s) => s.recordBadgeEvent);
  const badgeStats = useFormStore((s) => s.badgeStats);
  const markBingo = useFormStore((s) => s.markBingo);
  const whimsy = useFormStore((s) => s.whimsy);
  const soundOn = useFormStore((s) => s.soundOn);
  const holdMusic = useHoldMusic(soundOn && whimsy);

  const handleDownloadTemplate = (format: "json" | "csv") => {
    if (format === "json") {
      downloadBlob(
        new Blob([JSON.stringify(SAMPLE_BATCH, null, 2)], { type: "application/json" }),
        "batch_template.json"
      );
      return;
    }
    const headers = Array.from(new Set(SAMPLE_BATCH.flatMap((row) => Object.keys(row))));
    downloadBlob(
      new Blob([toCsv(headers, SAMPLE_BATCH as Array<Record<string, string>>)], {
        type: "text/csv"
      }),
      "batch_template.csv"
    );
  };

  /** Parses the picked file into rows without generating anything yet. */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    // Reset so re-selecting the same filename still fires onChange.
    e.target.value = "";
    if (!picked) return;

    setFile(picked);
    setRowResults(null);
    setParseError(null);
    setUnknownHeaders([]);
    setEntries(null);

    try {
      const text = await picked.text();
      const isCsv = /\.(csv|tsv|txt)$/i.test(picked.name) || !text.trimStart().startsWith("[");

      if (isCsv) {
        const table = parseBatchTable(text);
        if (table.rows.length === 0) {
          throw new Error("No data rows found. The first line must be a header of field codes.");
        }
        setUnknownHeaders(table.unknownHeaders);
        setEntries(table.rows as unknown as BatchEntry[]);
      } else {
        const raw: unknown = JSON.parse(text);
        if (!Array.isArray(raw)) throw new Error("JSON file must contain an array of objects.");
        setEntries(raw as BatchEntry[]);
      }
    } catch (err) {
      setParseError((err as Error).message);
    }
  };

  const processBatch = async () => {
    if (!entries) return;
    setProcessing(true);
    setRowResults(null);
    setProgress(null);
    holdMusic.start();

    const results: RowResult[] = [];

    try {
      // jsPDF default page: 595.28 × 841.89 pt (A4). Use 40pt margins.
      const PAGE_WIDTH_PT = 595.28;
      const PAGE_HEIGHT_PT = 841.89;
      const MARGIN_PT = 40;
      const CONTENT_WIDTH_PT = PAGE_WIDTH_PT - MARGIN_PT * 2;
      // Leave headroom for the caption above each barcode.
      const CONTENT_HEIGHT_PT = PAGE_HEIGHT_PT - MARGIN_PT * 2;

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      let pagesAdded = 0;

      setProgress({ done: 0, total: entries.length });

      for (let i = 0; i < entries.length; i++) {
        const row = entries[i];
        const meta = {
          row: i + 1,
          state: row?.state ?? "",
          version: row?.version ?? "",
          subfileType: row?.subfileType ?? "DL"
        };
        try {
          if (!row || !row.state || !row.version) {
            throw new Error("Missing 'state' or 'version'");
          }

          const schemaFields = getFieldsForStateAndVersion(row.state, row.version);
          const rowData = Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, v ?? ""])
          ) as Record<string, string>;

          const payload = generateAAMVAPayload(row.state, row.version, schemaFields, rowData, {
            strictMode: strict,
            autoGenerateDiscriminator: true,
            subfileType: row.subfileType || "DL"
          });

          const canvas = document.createElement("canvas");
          bwipjs.toCanvas(canvas, {
            ...PDF417_ENCODER_OPTIONS,
            scale: BATCH_SCALE,
            text: payload
          });

          const imgData = canvas.toDataURL("image/png");
          let { widthPt, heightPt } = canvasToPdfDimensions(
            canvas.width,
            canvas.height,
            CONTENT_WIDTH_PT
          );
          // Clamp height so a tall barcode never overflows the page.
          if (heightPt > CONTENT_HEIGHT_PT) {
            const s = CONTENT_HEIGHT_PT / heightPt;
            heightPt = CONTENT_HEIGHT_PT;
            widthPt *= s;
          }

          if (pagesAdded > 0) pdf.addPage();
          pagesAdded++;

          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `Barcode ${i + 1} — ${row.state} v${row.version} (${row.subfileType ?? "DL"})`,
            MARGIN_PT,
            MARGIN_PT - 6
          );
          pdf.addImage(imgData, "PNG", MARGIN_PT, MARGIN_PT, widthPt, heightPt);

          results.push({ ...meta, ok: true, error: "", png: imgData });
        } catch (err) {
          results.push({ ...meta, ok: false, error: (err as Error).message });
        }

        // Surface progress and yield so the UI can paint between rows.
        setProgress({ done: i + 1, total: entries.length });
        if ((i & 7) === 7) await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const succeeded = results.filter((r) => r.ok).length;
      if (succeeded > 0) pdf.save("batch_export.pdf");

      setRowResults(results);
      recordBadgeEvent({ batchRows: badgeStats.batchRows + succeeded });
      markBingo("batch-run");
    } catch (err) {
      setRowResults([
        {
          row: 0,
          state: "",
          version: "",
          subfileType: "",
          ok: false,
          error: (err as Error).message
        }
      ]);
    } finally {
      holdMusic.stop();
      setProcessing(false);
      setProgress(null);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!rowResults) return;
    const failed = rowResults.filter((r) => !r.ok);
    const csv = toCsv(
      ["row", "state", "version", "subfileType", "error"],
      failed.map((r) => ({
        row: r.row,
        state: r.state,
        version: r.version,
        subfileType: r.subfileType,
        error: r.error
      }))
    );
    downloadBlob(new Blob([csv], { type: "text/csv" }), "batch_errors.csv");
  };

  const handleDownloadZip = () => {
    if (!rowResults) return;
    const ok = rowResults.filter((r) => r.ok && r.png);
    if (ok.length === 0) return;
    const zip = createZip(
      ok.map((r) => ({
        name: `barcode_${String(r.row).padStart(4, "0")}_${r.state}_v${r.version}_${r.subfileType}.png`,
        data: dataUrlToBytes(r.png!)
      }))
    );
    downloadBlob(
      new Blob([zip as unknown as BlobPart], { type: "application/zip" }),
      "batch_barcodes.zip"
    );
  };

  if (!open) return null;

  const successCount = rowResults?.filter((r) => r.ok).length ?? 0;
  const failedCount = rowResults?.filter((r) => !r.ok).length ?? 0;
  const previewColumns = entries
    ? Array.from(new Set(entries.slice(0, PREVIEW_ROWS).flatMap((r) => Object.keys(r)))).slice(0, 8)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={processing ? undefined : onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-title"
        className="w-full max-w-3xl bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="batch-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <FileText size={16} className="text-blue-600" />
            Batch Processing
          </h2>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Close batch processing"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Upload a <strong>JSON array</strong> or a <strong>CSV/TSV</strong> whose header row
            holds AAMVA field codes. Each entry needs at least{" "}
            <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">state</code> and{" "}
            <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">version</code>.
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownloadTemplate("json")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <FileDown size={13} />
              template.json
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate("csv")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <FileSpreadsheet size={13} />
              template.csv
            </button>
            <button
              type="button"
              onClick={() => setShowExample((v) => !v)}
              aria-expanded={showExample}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              {showExample ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {showExample ? "Hide example" : "Show example"}
            </button>
          </div>

          {showExample && (
            <pre className="mb-4 max-h-48 overflow-auto rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-[11px] font-mono text-gray-700 dark:text-gray-300">
              {JSON.stringify(SAMPLE_BATCH, null, 2)}
            </pre>
          )}

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".json,.csv,.tsv,.txt,application/json,text/csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              aria-label="Select batch file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm transition font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Select JSON or CSV file for batch processing"
            >
              <Upload size={16} />
              <span>Select File</span>
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
              {file ? file.name : "No file selected"}
            </span>
          </div>

          {parseError && (
            <div
              role="alert"
              className="mt-3 p-3 rounded border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
            >
              {parseError}
            </div>
          )}

          {unknownHeaders.length > 0 && (
            <div className="mt-3 p-3 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
              {unknownHeaders.length} column{unknownHeaders.length === 1 ? "" : "s"} are not AAMVA
              field codes and will be ignored:{" "}
              <span className="font-mono">{unknownHeaders.join(", ")}</span>
            </div>
          )}

          {/* Pre-flight preview — see what was parsed before anything downloads. */}
          {entries && entries.length > 0 && !rowResults && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <ListChecks size={13} />
                Parsed {entries.length} row{entries.length === 1 ? "" : "s"} — first{" "}
                {Math.min(PREVIEW_ROWS, entries.length)} shown
              </div>
              <div className="overflow-auto rounded border border-gray-200 dark:border-gray-700 max-h-52">
                <table className="w-full text-[11px] border-collapse" aria-label="Batch preview">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="py-1 px-2 font-semibold">#</th>
                      {previewColumns.map((col) => (
                        <th key={col} className="py-1 px-2 font-semibold font-mono">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, PREVIEW_ROWS).map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <td className="py-1 px-2 text-gray-400">{i + 1}</td>
                        {previewColumns.map((col) => (
                          <td key={col} className="py-1 px-2 font-mono truncate max-w-[10ch]">
                            {row[col] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={processBatch}
              disabled={!entries || entries.length === 0 || processing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white px-6 py-2 rounded text-sm transition shadow font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-busy={processing}
            >
              <Download size={16} />
              <span>
                {processing
                  ? "Processing…"
                  : entries
                    ? `Generate ${entries.length} barcode${entries.length === 1 ? "" : "s"} & download PDF`
                    : "Generate & Download PDF"}
              </span>
            </button>

            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={strict}
                disabled={processing}
                onChange={(e) => setStrict(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-[#555] dark:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              Strict validation
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                (matches the editor&apos;s strict toggle)
              </span>
            </label>
          </div>

          {processing && progress && (
            <div className="mt-3" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>
                  Processing {progress.done} / {progress.total}
                </span>
                <span className="font-mono">
                  {progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%
                </span>
              </div>
              <div
                className="h-1.5 w-full max-w-xs rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
              >
                <div
                  className="h-full bg-blue-600 transition-all duration-150 ease-out"
                  style={{
                    width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`
                  }}
                />
              </div>
              {whimsy && soundOn && (
                <p className="mt-1 text-[11px] italic text-gray-400 dark:text-gray-500">
                  {holdMusic.caption}
                </p>
              )}
            </div>
          )}

          {rowResults && (
            <div
              role="status"
              className={`mt-4 p-4 rounded text-sm border ${
                failedCount > 0
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              }`}
            >
              <div className="flex items-center font-semibold mb-2 text-gray-800 dark:text-gray-100">
                {failedCount > 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                )}
                {successCount} succeeded, {failedCount} failed
              </div>

              {/* Results as artifacts, not just as text on screen. */}
              <div className="flex flex-wrap gap-2 mb-3">
                {failedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-red-300 dark:border-red-700 bg-white dark:bg-dark-surface text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <FileSpreadsheet size={13} />
                    Download error report (CSV)
                  </button>
                )}
                {successCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <Archive size={13} />
                    Download {successCount} PNG{successCount === 1 ? "" : "s"} (ZIP)
                  </button>
                )}
              </div>

              {failedCount > 0 && (
                <ul className="list-disc list-inside text-red-700 dark:text-red-400 text-xs space-y-1 max-h-40 overflow-auto">
                  {rowResults
                    .filter((r) => !r.ok)
                    .map((r) => (
                      <li key={r.row}>
                        Row {r.row}
                        {r.state ? ` (${r.state} v${r.version})` : ""}: {r.error}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
