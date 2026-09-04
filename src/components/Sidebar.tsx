import React, { useState } from "react";
import { HelpCircle, Info } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { AAMVA_STATES } from "../core/states";
import {
  AAMVA_VERSIONS,
  AAMVA_VERSION_KEYS,
  AAMVA_STATE_EXCLUDED_FIELDS,
  getFieldsForVersion,
  getFieldsForStateAndVersion
} from "../core/schema";
import { JurisdictionCombobox } from "./JurisdictionCombobox";

const VersionBrowser = React.lazy(() =>
  import("./VersionBrowser").then((module) => ({ default: module.VersionBrowser }))
);

interface SidebarProps {
  mobileHidden?: boolean;
  /** The step rail, which shares this column on desktop rather than taking a fourth. */
  children?: React.ReactNode;
}

// The territories actually present in AAMVA_STATES. The previous inline list
// also carried "MP", which is not a jurisdiction this app defines, so that
// branch could never be taken.
const US_TERRITORY_CODES = new Set(["AS", "GU", "VI", "PR"].filter((code) => code in AAMVA_STATES));

export const Sidebar: React.FC<SidebarProps> = ({ mobileHidden = false, children }) => {
  const {
    state,
    version,
    setStateVersion,
    strictMode,
    setStrictMode,
    subfileType,
    setSubfileType,
    recentStates,
    markBingo,
    fields: fieldValues
  } = useFormStore();
  const [tipsOpen, setTipsOpen] = useState(false);
  const [exclusionsDismissed, setExclusionsDismissed] = useState(false);

  const handleStateChange = (newState: string) => {
    const defaultVersion = AAMVA_STATES[newState]?.aamvaVersion || "10";
    setStateVersion(newState, defaultVersion);
    if (US_TERRITORY_CODES.has(newState)) markBingo("territory");
    const anyFilled = Object.values(fieldValues).some((v) => (v || "").trim().length > 0);
    if (anyFilled && newState !== state) markBingo("changed-state");
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStateVersion(state, e.target.value);
  };

  const fields = getFieldsForStateAndVersion(state, version);
  const defaultVersion = AAMVA_STATES[state]?.aamvaVersion;

  // Only list exclusions the active version actually defines — a field the
  // version never had is not an exclusion the user needs explaining.
  const excludedHere = React.useMemo(() => {
    const excluded = AAMVA_STATE_EXCLUDED_FIELDS[state] ?? [];
    if (excluded.length === 0) return [];
    const inVersion = new Set(getFieldsForVersion(version).map((f) => f.code));
    return excluded.filter((code) => inVersion.has(code));
  }, [state, version]);

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
      aria-label="Sections and settings"
    >
      {/* The step rail is the primary navigation for the form, so it goes
          first. Placed after the jurisdiction settings it was landing below the
          fold on a 950px-tall window — present, correct, and invisible. */}
      {children}

      <h2 className="mb-4 mt-1 text-k-label font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Settings
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
          <JurisdictionCombobox
            id="state-select"
            value={state}
            onChange={handleStateChange}
            recent={recentStates}
          />
        </div>

        {/* Jurisdiction exclusions — these fields are pruned from the form
            silently, which reads as a bug unless we say so. */}
        {excludedHere.length > 0 && !exclusionsDismissed && (
          <div className="flex items-start gap-2 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-2 text-[11px] text-blue-900 dark:text-blue-100">
            <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
            <p className="flex-1 leading-snug">
              <strong>{state}</strong> does not encode {excludedHere.length} field
              {excludedHere.length === 1 ? "" : "s"} at v{version}:{" "}
              <span className="font-mono">{excludedHere.join(", ")}</span>. They are hidden from the
              form and omitted from the payload.
            </p>
            <button
              type="button"
              onClick={() => setExclusionsDismissed(true)}
              aria-label="Dismiss exclusion notice"
              className="shrink-0 text-blue-700 dark:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              OK
            </button>
          </div>
        )}

        {/* AAMVA Version */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="version-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              AAMVA Version
            </label>
            {defaultVersion && version !== defaultVersion && (
              <button
                type="button"
                onClick={() => setStateVersion(state, defaultVersion)}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                title={`Reset to ${state}'s default version (${defaultVersion})`}
              >
                Reset to v{defaultVersion}
              </button>
            )}
          </div>
          <select
            id="version-select"
            value={version}
            onChange={handleVersionChange}
            className="w-full border-gray-300 dark:border-[#555] dark:bg-dark-surface2 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm p-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Select AAMVA version"
          >
            {AAMVA_VERSION_KEYS.map((v) => {
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
            className="w-full border-gray-300 dark:border-[#555] dark:bg-dark-surface2 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm p-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
        <p id="strictMode-desc" className="text-xs text-gray-500 dark:text-gray-400 -mt-2 pl-6">
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
