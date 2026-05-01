import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, GitCompare } from "lucide-react";
import { useToast } from "./Toast";

interface CompareViewProps {
  open: boolean;
  onClose: () => void;
}

interface PayloadFile {
  name: string;
  data: Record<string, string>;
}

async function readJsonFile(file: File): Promise<Record<string, string>> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON must be a single payload object.");
  }
  return Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)])
  );
}

export const CompareView: React.FC<CompareViewProps> = ({ open, onClose }) => {
  const [left, setLeft] = useState<PayloadFile | null>(null);
  const [right, setRight] = useState<PayloadFile | null>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  const handleLoad = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setSide: (p: PayloadFile) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await readJsonFile(file);
      setSide({ name: file.name, data });
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      toast.error(`Failed to load: ${(err as Error).message}`);
    }
  };

  const allKeys = useMemo(() => {
    const set = new Set<string>();
    if (left) Object.keys(left.data).forEach((k) => set.add(k));
    if (right) Object.keys(right.data).forEach((k) => set.add(k));
    return Array.from(set).sort();
  }, [left, right]);

  const diffStats = useMemo(() => {
    let same = 0;
    let different = 0;
    let onlyLeft = 0;
    let onlyRight = 0;
    for (const k of allKeys) {
      const l = left?.data[k];
      const r = right?.data[k];
      if (l === undefined && r !== undefined) onlyRight++;
      else if (l !== undefined && r === undefined) onlyLeft++;
      else if (l === r) same++;
      else different++;
    }
    return { same, different, onlyLeft, onlyRight };
  }, [allKeys, left, right]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="compare-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <GitCompare size={16} />
            Compare Two Payloads
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close compare view"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-200 dark:border-dark-border">
          {(
            [
              { side: "A", file: left, ref: leftInputRef, setSide: setLeft },
              { side: "B", file: right, ref: rightInputRef, setSide: setRight }
            ] as const
          ).map(({ side, file, ref, setSide }) => (
            <div key={side} className="flex flex-col gap-2">
              <input
                ref={ref}
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleLoad(e, setSide)}
                className="hidden"
                aria-label={`Load JSON payload ${side}`}
              />
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface2 hover:bg-gray-100 dark:hover:bg-[#383838] text-sm text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Upload size={14} />
                Load Payload {side}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={file?.name}>
                {file ? file.name : "No file selected"}
              </div>
            </div>
          ))}
        </div>

        {(left || right) && (
          <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-gray-200 dark:border-dark-border text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-surface2 text-gray-700 dark:text-gray-200">
              {allKeys.length} fields
            </span>
            <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
              {diffStats.same} match
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              {diffStats.different} differ
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {diffStats.onlyLeft} only in A
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              {diffStats.onlyRight} only in B
            </span>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {!left && !right ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Load two JSON payloads to compare them side by side.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse" aria-label="Payload field comparison">
              <thead className="sticky top-0 bg-white dark:bg-dark-surface">
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  <th className="py-1.5 pr-2 font-semibold w-16">Field</th>
                  <th className="py-1.5 pr-2 font-semibold">Payload A</th>
                  <th className="py-1.5 pr-2 font-semibold">Payload B</th>
                </tr>
              </thead>
              <tbody>
                {allKeys.map((k) => {
                  const l = left?.data[k];
                  const r = right?.data[k];
                  const both = l !== undefined && r !== undefined;
                  const equal = both && l === r;
                  let rowClass = "";
                  if (!equal) {
                    if (!both) rowClass = "bg-blue-50/60 dark:bg-blue-900/15";
                    else rowClass = "bg-amber-50/60 dark:bg-amber-900/15";
                  }
                  return (
                    <tr
                      key={k}
                      className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${rowClass}`}
                    >
                      <td className="py-1.5 pr-2 font-mono font-semibold text-gray-700 dark:text-gray-200 align-top">
                        {k}
                      </td>
                      <td
                        className={`py-1.5 pr-2 font-mono break-all align-top ${
                          equal
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {l ?? <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td
                        className={`py-1.5 pr-2 font-mono break-all align-top ${
                          equal
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {r ?? <span className="text-gray-400 italic">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
