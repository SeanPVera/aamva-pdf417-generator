import React from "react";
import {
  FileImage,
  FileCode2,
  FileText,
  Printer,
  Check,
  Clipboard,
  Braces,
  Square,
  Volume2
} from "lucide-react";
import { ClerkVoice, buildReadback } from "../hooks/useClerkVoice";
import { DecodeResult } from "../core/decoder";

interface PreviewActionsProps {
  canExport: boolean;
  handleExportPNG: () => void;
  handleExportSVG: () => void;
  handleExportPDF: () => void;
  handlePrint: () => void;
  includeNameInExport: boolean;
  setIncludeNameInExport: (v: boolean) => void;
  exportBasename: (prefix: string) => string;
  canCopyImage: boolean;
  handleCopyImage: () => void;
  imgCopied: boolean;
  handleCopyJson: () => void;
  jsonCopied: boolean;
  decoded: DecodeResult | null;
  stale: boolean;
  whimsy: boolean;
  voice: ClerkVoice;
}

export const PreviewActions: React.FC<PreviewActionsProps> = ({
  canExport,
  handleExportPNG,
  handleExportSVG,
  handleExportPDF,
  handlePrint,
  includeNameInExport,
  setIncludeNameInExport,
  exportBasename,
  canCopyImage,
  handleCopyImage,
  imgCopied,
  handleCopyJson,
  jsonCopied,
  decoded,
  stale,
  whimsy,
  voice
}) => {
  return (
    <>
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
        {/* Sized to the credential's real barcode area, which is what a print
            shop needs — the batch tool could already emit PDFs, the single
            payload could not. */}
        <button
          onClick={handleExportPDF}
          disabled={!canExport}
          aria-label="Export barcode as PDF"
          title="Export a print-ready PDF at the credential's physical size"
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 dark:bg-dark-surface2 dark:hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded shadow text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
        >
          <FileText size={14} />
          PDF
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
          <span className="block text-gray-500 dark:text-gray-400">
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
          title={voice.speaking ? "Stop reading payload aloud" : "Have the clerk read the payload back to you"}
          aria-label={voice.speaking ? "Stop reading payload aloud" : "Read decoded payload aloud"}
          aria-pressed={voice.speaking}
        >
          {voice.speaking ? <Square size={13} /> : <Volume2 size={13} />}
          {voice.speaking ? "Stop reading" : "Read it back to me"}
        </button>
      )}
    </>
  );
};
