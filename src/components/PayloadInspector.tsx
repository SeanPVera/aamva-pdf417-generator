import React, { useId, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowDownToLine
} from "lucide-react";
import type { ValidationIssue } from "../core/validation";

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
  stale: boolean;
  decodedEntries: Array<[string, string]>;
  decodeError?: string;
  issues: ValidationIssue[];
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
  stale,
  decodedEntries,
  decodeError,
  issues,
  onScrollToField,
  onCopyPayload,
  copied
}) => {
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
            {errorCount > 0 && (
              <div className="mb-2 flex justify-end">
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
                return (
                  <li key={`${issue.code}:${issue.severity}:${idx}`}>
                    <button
                      type="button"
                      className="w-full flex items-start gap-2 text-xs text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 p-1 rounded transition-colors group/issue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
    </>
  );
};
