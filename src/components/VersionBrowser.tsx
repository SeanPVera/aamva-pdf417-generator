import React, { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { AAMVA_VERSIONS } from "../core/schema";
import { useFormStore } from "../hooks/useFormStore";

export const VersionBrowser: React.FC = () => {
  const { version: activeVersion } = useFormStore();
  const [open, setOpen] = useState(false);
  const [browsedVersion, setBrowsedVersion] = useState(activeVersion);

  const versionDef = AAMVA_VERSIONS[browsedVersion];
  const requiredCount = versionDef?.fields.filter((f) => f.required).length ?? 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm font-semibold text-gray-700 dark:text-gray-200"
        aria-expanded={open}
        aria-controls="version-browser-panel"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={14} />
          Version Browser
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div id="version-browser-panel" className="p-3 bg-white dark:bg-gray-800 space-y-3">
          {/* Version picker */}
          <div>
            <label
              htmlFor="vb-version-select"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Browse version
            </label>
            <select
              id="vb-version-select"
              value={browsedVersion}
              onChange={(e) => setBrowsedVersion(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              {Object.keys(AAMVA_VERSIONS).map((v) => (
                <option key={v} value={v}>
                  {v} — {AAMVA_VERSIONS[v].name}
                  {v === activeVersion ? " (active)" : ""}
                </option>
              ))}
            </select>
          </div>

          {versionDef && (
            <>
              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  <strong className="text-gray-700 dark:text-gray-200">
                    {versionDef.fields.length}
                  </strong>{" "}
                  fields
                </span>
                <span>
                  <strong className="text-red-600 dark:text-red-400">{requiredCount}</strong>{" "}
                  required
                </span>
                <span>
                  <strong className="text-gray-700 dark:text-gray-200">
                    {versionDef.fields.length - requiredCount}
                  </strong>{" "}
                  optional
                </span>
              </div>

              <div className="overflow-auto max-h-64 rounded border border-gray-200 dark:border-gray-700">
                <table
                  className="w-full text-xs border-collapse"
                  aria-label={`Fields for AAMVA version ${browsedVersion}`}
                >
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                    <tr className="text-left text-gray-500 dark:text-gray-300">
                      <th className="py-1.5 px-2 font-semibold border-b border-gray-200 dark:border-gray-600 w-10">
                        Code
                      </th>
                      <th className="py-1.5 px-2 font-semibold border-b border-gray-200 dark:border-gray-600">
                        Label
                      </th>
                      <th className="py-1.5 px-2 font-semibold border-b border-gray-200 dark:border-gray-600 w-16">
                        Type
                      </th>
                      <th className="py-1.5 px-2 font-semibold border-b border-gray-200 dark:border-gray-600 w-16 text-center">
                        Req?
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionDef.fields.map((field) => (
                      <tr
                        key={field.code}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      >
                        <td className="py-1 px-2 font-mono font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                          {field.code}
                        </td>
                        <td className="py-1 px-2 text-gray-700 dark:text-gray-300">
                          {field.label}
                        </td>
                        <td className="py-1 px-2 text-gray-400 dark:text-gray-500">{field.type}</td>
                        <td className="py-1 px-2 text-center">
                          {field.required ? (
                            <span className="text-red-500" aria-label="Required">
                              ✓
                            </span>
                          ) : (
                            <span
                              className="text-gray-300 dark:text-gray-600"
                              aria-label="Optional"
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
