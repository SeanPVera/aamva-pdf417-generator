import React, { useId, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowDownToLine,
  Wand2
} from "lucide-react";
import type { ValidationIssue } from "../core/validation";
import type { QuickFix } from "../core/quickFix";
import { inspectPayload, summarizeAnomalies } from "../core/inspect";

export function CollapsibleSection({
  title,
  badge,
  badgeColor = "gray",
  children,
  defaultOpen = false
}: {
  title: string;
  badge?: string | number;
  badgeColor?: "gray" | "green" | "red" | "blue" | "amber";
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const badgeClasses = {
    gray: "bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-200",
    green: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    red: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
  }[badgeColor];

  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-dark-surface2 hover:bg-gray-100 dark:hover:bg-[#383838] transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {title}
        </span>
        {badge !== undefined && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div id={id} className="px-3 py-2 bg-white dark:bg-dark-surface">
          {children}
        </div>
      )}
    </div>
  );
}

interface PayloadInspectorProps {
  payloadStr: string;
  /** The AAMVA bytes a scan or paste carried, when the form came from one. */
  sourcePayload?: string | null;
  stale: boolean;
  decodedEntries: Array<[string, string]>;
  decodeError?: string;
  issues: ValidationIssue[];
  /** Deterministic repairs available for the current values, by field code. */
  fixes?: QuickFix[];
  onApplyFix?: (fix: QuickFix) => void;
  onApplyAllFixes?: () => void;
  onScrollToField: (code: string) => void;
  onCopyPayload: () => void;
  copied: boolean;
}

/**
 * Payload, decode, and validation views. Rendered inline in the preview column
 * and again inside the expand-inspector modal, so the two can never drift.
 */
export const PayloadInspector: React.FC<PayloadInspectorProps> = ({
  payloadStr,
  sourcePayload,
  stale,
  decodedEntries,
  decodeError,
  issues,
  fixes = [],
  onApplyFix,
  onApplyAllFixes,
  onScrollToField,
  onCopyPayload,
  copied
}) => {
  const fixByCode = React.useMemo(() => new Map(fixes.map((fix) => [fix.code, fix])), [fixes]);
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const issueCount = issues.length;

  const reportBadge =
    issueCount === 0
      ? "Pass"
      : warningCount === 0
        ? `${errorCount} error${errorCount === 1 ? "" : "s"}`
        : errorCount === 0
          ? `${warningCount} warning${warningCount === 1 ? "" : "s"}`
          : `${errorCount} error${errorCount === 1 ? "" : "s"} · ${warningCount} warning${warningCount === 1 ? "" : "s"}`;
  const reportBadgeColor: "green" | "red" | "amber" =
    issueCount === 0 ? "green" : errorCount > 0 ? "red" : "amber";

  return (
    <>
      <CollapsibleSection
        title="Raw Payload"
        badge={payloadStr.length || undefined}
        badgeColor="blue"
        defaultOpen
      >
        <div className="relative group/payload">
          <textarea
            readOnly
            value={payloadStr}
            aria-label="Raw AAMVA payload string"
            aria-busy={stale}
            className={`w-full h-32 p-2 pr-10 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-700 dark:text-gray-300 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-opacity ${
              stale ? "opacity-40" : ""
            }`}
          />
          <button
            onClick={onCopyPayload}
            disabled={!payloadStr || stale}
            title={
              copied
                ? "Copied!"
                : stale
                  ? "Waiting for the payload to settle…"
                  : "Copy to clipboard"
            }
            aria-label={copied ? "Copied payload" : "Copy raw payload to clipboard"}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-all opacity-0 group-hover/payload:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:hidden"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          {copied && (
            <span className="absolute top-2 right-10 px-2 py-1 rounded bg-gray-800 text-white text-xs font-medium shadow-lg animate-in fade-in zoom-in duration-200">
              Copied!
            </span>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Validation Report"
        badge={reportBadge}
        badgeColor={reportBadgeColor}
        defaultOpen={issueCount > 0}
      >
        {issueCount === 0 ? (
          <div className="flex items-center gap-2 py-1 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 size={15} />
            All fields pass validation
          </div>
        ) : (
          <>
            {(errorCount > 0 || fixes.length > 0) && (
              <div className="mb-2 flex flex-wrap justify-end gap-1.5">
                {/* Every listed fix is a rewrite of a value the user already
                    typed, and each was checked against the validator before
                    being offered — so applying them in bulk is safe. */}
                {fixes.length > 0 && onApplyAllFixes && (
                  <button
                    type="button"
                    onClick={onApplyAllFixes}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`Apply ${fixes.length} quick fixes`}
                    title={fixes.map((f) => `${f.code} → ${f.value}`).join("\n")}
                  >
                    <Wand2 size={12} />
                    Fix {fixes.length}
                  </button>
                )}
                {errorCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstError = issues.find((i) => i.severity === "error");
                      if (firstError) onScrollToField(firstError.code);
                    }}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="Scroll to first error"
                  >
                    <ArrowDownToLine size={12} />
                    Scroll to first error
                  </button>
                )}
              </div>
            )}
            <ul className="space-y-1.5 pt-1" role="list" aria-label="Validation issues">
              {issues.map((issue, idx) => {
                const isWarn = issue.severity === "warning";
                const Icon = isWarn ? AlertTriangle : XCircle;
                const iconClass = isWarn
                  ? "text-amber-500 mt-0.5 shrink-0"
                  : "text-red-500 mt-0.5 shrink-0";
                const messageClass = isWarn
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-red-600 dark:text-red-400";
                const fix = fixByCode.get(issue.code);
                return (
                  <li
                    key={`${issue.code}:${issue.severity}:${idx}`}
                    className="flex items-start gap-1"
                  >
                    <button
                      type="button"
                      className="flex-1 flex items-start gap-2 text-xs text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 p-1 rounded transition-colors group/issue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      data-severity={issue.severity}
                      onClick={() => onScrollToField(issue.code)}
                      title={`Jump to ${issue.label} (${issue.code})`}
                    >
                      <Icon size={13} className={iconClass} aria-hidden />
                      <span>
                        <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">
                          {issue.code}
                        </span>{" "}
                        <span className="text-gray-500 dark:text-gray-400">({issue.label}):</span>{" "}
                        <span className={messageClass}>{issue.message}</span>
                      </span>
                    </button>
                    {fix && onApplyFix && (
                      <button
                        type="button"
                        onClick={() => onApplyFix(fix)}
                        title={fix.description}
                        aria-label={`${fix.description} for ${fix.code}`}
                        className="mt-1 shrink-0 inline-flex items-center gap-1 rounded border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <Wand2 size={10} aria-hidden />
                        Fix
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Decoded Output"
        badge={decodedEntries.length || undefined}
        badgeColor="blue"
      >
        {decodeError ? (
          <p className="text-xs text-red-600 dark:text-red-400 py-1">{decodeError}</p>
        ) : decodedEntries.length === 0 ? (
          <p className="text-xs text-gray-400 py-1">No payload to decode yet.</p>
        ) : (
          <table className="w-full text-xs border-collapse" aria-label="Decoded AAMVA fields">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                <th className="py-1 pr-2 font-semibold w-12">Code</th>
                <th className="py-1 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {decodedEntries.map(([code, val]) => (
                <tr
                  key={code}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-surface2 transition-colors"
                >
                  <td className="py-1 pr-2 font-mono font-semibold">
                    <button
                      type="button"
                      onClick={() => onScrollToField(code)}
                      className="text-blue-700 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-0.5"
                      title={`Jump to field ${code}`}
                    >
                      {code}
                    </button>
                  </td>
                  <td className="py-1 font-mono text-gray-700 dark:text-gray-300 break-all">
                    {val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>

      <WireLedger payloadStr={payloadStr} sourcePayload={sourcePayload} />
    </>
  );
};

/**
 * Byte accounting for the payload on the wire.
 *
 * The decoded table above answers "what does this card say". This answers
 * "where did every byte go" — a different question, and the one a field dump
 * cannot answer. A decoded New York credential declared a 323-byte DL subfile
 * whose visible elements accounted for 224, and there was no way to tell from a
 * list of name/value pairs whether the missing bytes were fixed-width padding
 * or elements the reader had no name for. Both show up here.
 */
const WireLedger: React.FC<{ payloadStr: string; sourcePayload?: string | null }> = ({
  payloadStr,
  sourcePayload
}) => {
  // Default to the scanned card when there is one. Inspecting our own
  // re-encoding is the one thing the ledger cannot learn anything from: it
  // balances by construction, because this encoder wrote it.
  const [showSource, setShowSource] = useState(true);
  const inspecting = sourcePayload && showSource ? sourcePayload : payloadStr;
  const result = React.useMemo(() => inspectPayload(inspecting), [inspecting]);
  const inspection = result.inspection;
  const anomalies = inspection ? summarizeAnomalies(inspection) : null;

  return (
    <CollapsibleSection
      title="Wire Ledger"
      badge={inspection ? (anomalies ? "Check" : "Balanced") : undefined}
      badgeColor={anomalies ? "amber" : "green"}
    >
      {sourcePayload ? (
        <div
          className="flex items-center gap-1 mb-2 text-xs"
          role="group"
          aria-label="Which payload to inspect"
        >
          {(
            [
              ["Scanned card", true],
              ["This app's output", false]
            ] as const
          ).map(([label, wantsSource]) => (
            <button
              key={label}
              type="button"
              onClick={() => setShowSource(wantsSource)}
              aria-pressed={showSource === wantsSource}
              className={`px-2 py-0.5 rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                showSource === wantsSource
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium"
                  : "border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {!inspection ? (
        <p className="text-xs text-gray-400 py-1">{result.error ?? "No payload to inspect yet."}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            IIN {inspection.iin}
            {inspection.state ? ` (${inspection.state})` : ""} · AAMVA v{inspection.version} ·
            jurisdiction version {inspection.jurisdictionVersion} · {inspection.totalBytes} bytes
          </p>

          <table className="w-full text-xs border-collapse" aria-label="Subfile byte accounting">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                <th className="py-1 pr-2 font-semibold">Subfile</th>
                <th className="py-1 pr-2 font-semibold text-right">Offset</th>
                <th className="py-1 pr-2 font-semibold text-right">Declared</th>
                <th className="py-1 pr-2 font-semibold text-right">Accounted</th>
                <th className="py-1 font-semibold text-right">Unaccounted</th>
              </tr>
            </thead>
            <tbody>
              {inspection.subfiles.map((s) => (
                <tr
                  key={`${s.type}-${s.declaredOffset}`}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-0 font-mono"
                >
                  <td className="py-1 pr-2 font-semibold">
                    {s.type}
                    {s.repaired ? (
                      <span
                        className="ml-1 text-amber-600 dark:text-amber-400"
                        title="Declared offset or length did not match the bytes; repaired on read"
                      >
                        ⚠
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1 pr-2 text-right">{s.declaredOffset}</td>
                  <td className="py-1 pr-2 text-right">{s.declaredLength}</td>
                  <td className="py-1 pr-2 text-right">{s.accountedBytes}</td>
                  <td
                    className={`py-1 text-right ${
                      s.unaccountedBytes === 0
                        ? "text-green-700 dark:text-green-400"
                        : "text-amber-700 dark:text-amber-400 font-semibold"
                    }`}
                  >
                    {s.unaccountedBytes === 0
                      ? "0"
                      : `${s.unaccountedBytes > 0 ? "+" : ""}${s.unaccountedBytes}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {inspection.paddedCodes.length > 0 && (
            <div className="text-xs">
              <div className="font-semibold text-gray-600 dark:text-gray-300 mb-0.5">
                Space-filled on the wire
              </div>
              <ul className="font-mono text-gray-600 dark:text-gray-400 space-y-0.5">
                {inspection.elements
                  .filter((e) => e.padding > 0)
                  .map((e) => (
                    <li key={`${e.subfile}-${e.code}`}>
                      {e.code} — &quot;{e.value}&quot; + {e.padding} space
                      {e.padding === 1 ? "" : "s"}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {inspection.unknownCodes.length > 0 && (
            <div className="text-xs">
              <div className="font-semibold text-gray-600 dark:text-gray-300 mb-0.5">
                Not in the v{inspection.version} field table
              </div>
              <ul className="font-mono text-gray-600 dark:text-gray-400 space-y-0.5">
                {inspection.elements
                  .filter((e) => !e.known && !e.code.startsWith("Z"))
                  .map((e) => (
                    <li key={`${e.subfile}-${e.code}`}>
                      {e.code} — {e.value || <span className="italic">empty</span>}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {anomalies ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">{anomalies}.</p>
          ) : (
            <p className="text-xs text-green-700 dark:text-green-400">
              Every declared byte is accounted for.
              {!sourcePayload || !showSource
                ? " (This is this app's own output, so it balances by construction — scan or paste a card to inspect one.)"
                : ""}
            </p>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
};
