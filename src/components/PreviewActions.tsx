import React from "react";
import { buildReadback, type ClerkVoice } from "../hooks/useClerkVoice";
import type { DecodeResult } from "../core/decoder";
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

export const PreviewActions: React.FC<PreviewActionsProps> = (p) => (
  <>
    <div className="export-buttons" role="group" aria-label="Export barcode">
      <button
        className="wb-button primary"
        disabled={!p.canExport}
        onClick={p.handleExportPNG}
        aria-label="Export barcode as PNG"
      >
        PNG
      </button>
      <button
        className="wb-button"
        disabled={!p.canExport}
        onClick={p.handleExportSVG}
        aria-label="Export barcode as SVG"
      >
        SVG
      </button>
      <button
        className="wb-button"
        disabled={!p.canExport}
        onClick={p.handleExportPDF}
        aria-label="Export barcode as PDF"
      >
        PDF
      </button>
      <button
        className="wb-button"
        disabled={!p.canExport}
        onClick={p.handlePrint}
        aria-label="Print barcode"
      >
        Print
      </button>
    </div>
    <div className="copy-actions">
      {p.canCopyImage && (
        <button
          className="wb-button"
          disabled={!p.canExport}
          onClick={p.handleCopyImage}
          aria-label="Copy barcode image to clipboard"
        >
          {p.imgCopied ? "Copied image" : "Copy image"}
        </button>
      )}
      <button
        className="wb-button"
        disabled={!p.decoded?.json || p.stale}
        onClick={p.handleCopyJson}
        aria-label="Copy decoded payload as JSON"
      >
        {p.jsonCopied ? "Copied JSON" : "Copy JSON"}
      </button>
    </div>
    <details className="export-details">
      <summary>Filename & privacy</summary>
      <label>
        <input
          type="checkbox"
          aria-describedby="export-filename-preview"
          checked={p.includeNameInExport}
          onChange={(e) => p.setIncludeNameInExport(e.target.checked)}
        />
        Put the cardholder's name in export filenames
      </label>
      <span id="export-filename-preview">
        {p.includeNameInExport ? "On: " : "Off: "}
        <code>{p.exportBasename("barcode")}.png</code>
      </span>
      <p>Downloads and copied data contain the record. Filenames omit the name by default.</p>
    </details>
    {p.voice.supported && p.decoded?.json && (
      <button
        className="text-button"
        disabled={p.stale}
        onClick={() =>
          p.voice.speaking ? p.voice.stop() : p.voice.speak(buildReadback(p.decoded?.json ?? {}))
        }
        title={
          p.voice.speaking
            ? "Stop reading the payload aloud"
            : "Read the payload using a local voice"
        }
      >
        {p.voice.speaking ? "Stop reading" : "Read it back to me"}
      </button>
    )}
  </>
);
