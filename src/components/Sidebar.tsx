import React from "react";
import { useFormStore } from "../hooks/useFormStore";
import { AAMVA_STATES, isJurisdictionSupported } from "../core/states";
import { AAMVA_VERSIONS, getFieldsForStateAndVersion } from "../core/schema";
import { VersionBrowser } from "./VersionBrowser";

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
    setSubfileType
  } = useFormStore();

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    const defaultVersion = AAMVA_STATES[newState]?.aamvaVersion || "10";
    setStateVersion(newState, defaultVersion);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStateVersion(state, e.target.value);
  };

  const fields = getFieldsForStateAndVersion(state, version);
  const requiredCount = fields.filter((f) => f.required).length;

  return (
    <aside
      className={`dmv-sidebar w-full lg:w-64 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 flex flex-col max-h-[45vh] lg:max-h-none overflow-y-auto p-4 shadow-sm ${
        mobileHidden ? "hidden lg:flex" : "flex"
      }`}
      aria-label="Configuration"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Configuration</h2>

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
            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
            aria-label="Select state or territory"
          >
            {Object.keys(AAMVA_STATES)
              .sort()
              .map((code) => {
                const meta = AAMVA_STATES[code];
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
            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
            aria-label="Select AAMVA version"
          >
            {Object.keys(AAMVA_VERSIONS).map((v) => (
              <option key={v} value={v}>
                {v} — {AAMVA_VERSIONS[v].name}
              </option>
            ))}
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
            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            aria-describedby="strictMode-desc"
          />
          <label
            htmlFor="strictMode"
            className="ml-2 block text-sm text-gray-900 dark:text-gray-200"
          >
            Strict Compliance Mode
          </label>
        </div>
        <p id="strictMode-desc" className="text-xs text-gray-400 dark:text-gray-500 -mt-2 pl-6">
          Enforces all AAMVA format requirements at generation time.
        </p>
      </div>

      {/* Schema Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
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

        {/* Version Browser */}
        <VersionBrowser />
      </div>
    </aside>
  );
};
