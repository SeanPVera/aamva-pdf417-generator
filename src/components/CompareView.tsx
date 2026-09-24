import React, { useMemo, useRef, useState } from "react";
import { X, Upload, GitCompare, FileText } from "lucide-react";
import { useToast } from "./Toast";
import { useModalShell } from "../hooks/useModalShell";
import { useFormStore } from "../hooks/useFormStore";
import { parseImportedPayload, MAX_IMPORT_BYTES } from "../core/importPayload";

interface CompareViewProps {
  open: boolean;
  onClose: () => void;
}

interface PayloadFile {
  name: string;
  data: Record<string, string>;
}

async function readJsonFile(file: File): Promise<Record<string, string>> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("Choose a record smaller than 1 MB.");
  const result = parseImportedPayload(await file.text(), file.name);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export const CompareView: React.FC<CompareViewProps> = ({ open, onClose }) => {
  const { fields, state, version, subfileType } = useFormStore();
  const [left, setLeft] = useState<PayloadFile | null>(null);
  const [right, setRight] = useState<PayloadFile | null>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const dialogRef = useModalShell<HTMLDivElement>({ open, onClose });

  const requests = useRef({ A: 0, B: 0 });
  React.useEffect(
    () => () => {
      requests.current.A++;
      requests.current.B++;
    },
    []
  );
  const handleUseActiveForm = (setSide: (p: PayloadFile) => void, side: "A" | "B") => {
    requests.current[side]++;
    const activeData: Record<string, string> = { state, version, subfileType, ...fields };
    const name = `Active Form (${state} v${version})`;
    setSide({ name, data: activeData });
    toast.success(`Loaded active form for payload ${side}`);
  };

  const handleLoad = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setSide: (p: PayloadFile) => void,
    side: "A" | "B"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const token = ++requests.current[side];
    try {
      const data = await readJsonFile(file);
      if (token !== requests.current[side]) return;
      setSide({ name: file.name, data });
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      if (token !== requests.current[side]) return;
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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        className="modal-panel wide"
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
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Close compare view"
            className="inline-flex h-k-touch w-k-touch items-center justify-center rounded-k hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
                onChange={(e) => handleLoad(e, setSide, side)}
                className="hidden"
                aria-label={`Load JSON payload ${side}`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => ref.current?.click()}
                  className="inline-flex h-k-touch min-h-k-touch flex-1 items-center justify-center gap-2 rounded-k border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface2 px-3 text-k-help font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#383838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Upload size={14} />
                  Load Payload {side}
                </button>
                <button
                  type="button"
                  onClick={() => handleUseActiveForm(setSide, side)}
                  aria-label={`Use active form for payload ${side}`}
                  title="Load current active form fields into comparison"
                  className="inline-flex h-k-touch min-h-k-touch items-center justify-center gap-1.5 rounded-k border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface2 px-3 text-k-help font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#383838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 whitespace-nowrap"
                >
                  <FileText size={13} />
                  <span className="hidden sm:inline">Use active form</span>
                  <span className="sm:hidden">Active</span>
                </button>
              </div>
              <div className="flex min-h-k-touch items-center gap-1">
                <span
                  className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate"
                  title={file?.name}
                >
                  {file ? file.name : "No file selected"}
                </span>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      requests.current[side]++;
                      setSide(null);
                      toast.info(`Cleared payload ${side}`);
                    }}
                    aria-label={`Clear payload ${side}`}
                    className="inline-flex h-k-touch w-k-touch shrink-0 items-center justify-center rounded-k text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {(left || right) && (
          <div className="comparison-summary">
            <span>
              <strong>{allKeys.length}</strong> fields
            </span>
            <span>
              <strong>{diffStats.same}</strong> match
            </span>
            <span>
              <strong>{diffStats.different}</strong> differ
            </span>
            <span>
              <strong>{diffStats.onlyLeft}</strong> only in A
            </span>
            <span>
              <strong>{diffStats.onlyRight}</strong> only in B
            </span>
          </div>
        )}

        <div
          className="flex-1 overflow-auto p-4"
          role="region"
          aria-label="Comparison results"
          tabIndex={0}
        >
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
