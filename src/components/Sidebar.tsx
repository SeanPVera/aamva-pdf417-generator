import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { AAMVA_STATES, isJurisdictionSupported } from "../core/states";
import { AAMVA_VERSIONS, getFieldsForStateAndVersion } from "../core/schema";

const VersionBrowser = React.lazy(() =>
  import("./VersionBrowser").then((module) => ({ default: module.VersionBrowser }))
);

interface SidebarProps {
  mobileHidden?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileHidden = false }) => {
  const {
    state,
    version,
    setStateVersion,
    strictMode,
    setStrictMode,
    subfileType,
    setSubfileType,
    fields: fieldValues
  } = useFormStore();
  const [tipsOpen, setTipsOpen] = useState(false);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    const defaultVersion = AAMVA_STATES[newState]?.aamvaVersion || "10";
    setStateVersion(newState, defaultVersion);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStateVersion(state, e.target.value);
  };

  const fields = getFieldsForStateAndVersion(state, version);
  const requiredFields = fields.filter((f) => f.required);
  const requiredCount = requiredFields.length;
  const requiredFilled = requiredFields.filter(
    (f) => (fieldValues[f.code] || "").trim().length > 0
  ).length;
  const progressPct =
    requiredCount === 0 ? 100 : Math.round((requiredFilled / requiredCount) * 100);
  const progressColor =
    progressPct === 100 ? "bg-green-500" : progressPct >= 50 ? "bg-brand-500" : "bg-amber-500";

  return (
    <aside
      className={`state-themed-sidebar dmv-sidebar w-full lg:w-64 bg-white dark:bg-dark-surface border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-dark-border z-10 flex flex-col max-h-[45vh] lg:max-h-none overflow-y-auto p-4 shadow-sm ${
        mobileHidden ? "hidden lg:flex" : "flex"
      }`}
      aria-label="Configuration"
    >
      <h2 className="text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100 mb-4">
        Configuration
      </h2>

      <div className="space-y-4 flex-1">
        {/* State / Territory */}
        <div>
          <label
            htmlFor="state-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            State / Territory
          </label>
          <select
            id="state-select"
            value={state}
            onChange={handleStateChange}
            className="w-full w-full border-gray-300 dark:border-[#555] dark:bg-dark-surface2 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm p-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Select state or territory"
          >
            {Object.keys(AAMVA_STATES)
              .sort()
              .map((code) => {
                const meta = AAMVA_STATES[code];
                if (!meta) return null;
                const supported = isJurisdictionSupported(code);
                return (
                  <option key={code} value={code} disabled={!supported}>
                    {code} — {meta.name} {!supported ? "(unsupported)" : ""}
                  </option>
                );
              })}
          </select>
        </div>

        {/* AAMVA Version */}
        <div>
          <label
            htmlFor="version-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            AAMVA Version
          </label>
          <select
            id="version-select"
            value={version}
            onChange={handleVersionChange}
            className="w-full w-full border-gray-300 dark:border-[#555] dark:bg-dark-surface2 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm p-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Select AAMVA version"
          >
            {Object.keys(AAMVA_VERSIONS).map((v) => {
              const versionDef = AAMVA_VERSIONS[v];
              if (!versionDef) return null;
              return (
                <option key={v} value={v}>
                  {v} — {versionDef.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Subfile Type */}
        <div>
          <label
            htmlFor="subfile-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Subfile Type
          </label>
          <select
            id="subfile-select"
            value={subfileType}
            onChange={(e) => setSubfileType(e.target.value as "DL" | "ID")}
            className="w-full w-full border-gray-300 dark:border-[#555] dark:bg-dark-surface2 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm p-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Select subfile type"
          >
            <option value="DL">Driver's License (DL)</option>
            <option value="ID">Identification Card (ID)</option>
          </select>
        </div>

        {/* Strict Mode */}
        <div className="flex items-center pt-1">
          <input
            id="strictMode"
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-[#555] dark:bg-dark-surface2 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
            aria-describedby="strictMode-desc"
          />
          <label
            htmlFor="strictMode"
            className="ml-2 block text-sm text-gray-900 dark:text-gray-200"
          >
            Strict Compliance Mode
          </label>
          <button
            type="button"
            onClick={() => setTipsOpen((v) => !v)}
            aria-expanded={tipsOpen}
            aria-controls="validation-tips"
            aria-label="Show validation tips"
            title="What does strict mode enforce?"
            className="ml-1.5 p-0.5 rounded text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        <p id="strictMode-desc" className="text-xs text-gray-400 dark:text-gray-500 -mt-2 pl-6">
          Enforces all AAMVA format requirements at generation time.
        </p>
        {tipsOpen && (
          <div
            id="validation-tips"
            className="mt-1 mx-1 p-3 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-xs text-blue-900 dark:text-blue-100 space-y-1.5"
          >
            <p className="font-semibold">Validation Tips</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Strict mode on:</strong> regex patterns, lengths, and state-specific rules
                must pass — generation blocks on errors.
              </li>
              <li>
                <strong>Strict mode off:</strong> warnings are surfaced inline but do not block
                payload generation.
              </li>
              <li>Cross-field checks (date order, age at issuance) always run.</li>
              <li>State-specific patterns enforce DAQ, DCF, and DDB formats.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Schema Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schema Info</h3>
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <strong className="text-gray-700 dark:text-gray-200">{fields.length}</strong> fields
            </span>
            <span>
              <strong className="text-red-600 dark:text-red-400">{requiredCount}</strong> required
            </span>
          </div>
        </div>

        {/* Required-fields progress */}
        {requiredCount > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {requiredFilled}/{requiredCount} Required Fields
              </span>
              <span className="text-gray-500 dark:text-gray-400 font-mono">{progressPct}%</span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-gray-200 dark:bg-dark-surface2 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={requiredCount}
              aria-valuenow={requiredFilled}
              aria-label="Required fields completion"
            >
              <div
                className={`h-full transition-all duration-300 ease-out ${progressColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Version Browser */}
        <React.Suspense fallback={null}>
          <VersionBrowser />
        </React.Suspense>
      </div>
    </aside>
  );
};
