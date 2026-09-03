import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, BookOpen, Search, X as XIcon, Check } from "lucide-react";
import { AAMVA_VERSIONS, AAMVA_VERSION_KEYS } from "../core/schema";
import { useFormStore } from "../hooks/useFormStore";

export const VersionBrowser: React.FC = () => {
  const { state, version: activeVersion, setStateVersion } = useFormStore();
  const [open, setOpen] = useState(false);
  const [browsedVersion, setBrowsedVersion] = useState(activeVersion);
  const [filterQuery, setFilterQuery] = useState("");

  const versionDef = AAMVA_VERSIONS[browsedVersion];
  const requiredCount = useMemo(
    () => versionDef?.fields.filter((f) => f.required).length ?? 0,
    [versionDef]
  );

  const filteredFields = useMemo(() => {
    if (!versionDef) return [];
    const q = filterQuery.trim().toLowerCase();
    if (!q) return versionDef.fields;
    return versionDef.fields.filter(
      (f) => f.code.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
  }, [versionDef, filterQuery]);

  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-dark-surface2 hover:bg-gray-100 dark:hover:bg-[#383838] transition text-sm font-semibold text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
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
        <div id="version-browser-panel" className="p-3 bg-white dark:bg-dark-surface space-y-3">
          {/* Version picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="vb-version-select"
                className="block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                Browse version
              </label>
              {browsedVersion !== activeVersion && (
                <button
                  type="button"
                  onClick={() => setStateVersion(state, browsedVersion)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                  <Check size={11} aria-hidden />
                  Set v{browsedVersion} as active
                </button>
              )}
            </div>
            <select
              id="vb-version-select"
              value={browsedVersion}
              onChange={(e) => setBrowsedVersion(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {AAMVA_VERSION_KEYS.map((v) => {
                const versionDef = AAMVA_VERSIONS[v];
                if (!versionDef) return null;
                return (
                  <option key={v} value={v}>
                    {v} — {versionDef.name}
                    {v === activeVersion ? " (active)" : ""}
                  </option>
                );
              })}
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

              {/* Field filter input */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter fields by code or label..."
                  aria-label="Filter fields in version browser"
                  className="w-full pl-7 pr-7 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface2 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery("")}
                    aria-label="Clear version browser filter"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>

              <div className="overflow-auto max-h-64 rounded border border-gray-200 dark:border-dark-border">
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
                    {filteredFields.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-3 px-2 text-center text-gray-500 dark:text-gray-400"
                        >
                          No fields matching &ldquo;{filterQuery}&rdquo;
                        </td>
                      </tr>
                    ) : (
                      filteredFields.map((field) => (
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
                          <td className="py-1 px-2 text-gray-500 dark:text-gray-400">
                            {field.type}
                          </td>
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
                      ))
                    )}
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
