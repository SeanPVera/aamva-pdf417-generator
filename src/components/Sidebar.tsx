import React from 'react';
import { useFormStore } from '../hooks/useFormStore';
import { AAMVA_STATES, isJurisdictionSupported } from '../core/states';
import { AAMVA_VERSIONS, getFieldsForStateAndVersion } from '../core/schema';

export const Sidebar: React.FC = () => {
  const { state, version, setStateVersion, strictMode, setStrictMode, subfileType, setSubfileType } = useFormStore();

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    const defaultVersion = AAMVA_STATES[newState]?.aamvaVersion || '10';
    setStateVersion(newState, defaultVersion);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStateVersion(state, e.target.value);
  };

  const fields = getFieldsForStateAndVersion(state, version);
  const requiredCount = fields.filter((f) => f.required).length;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State / Territory</label>
          <select
            value={state}
            onChange={handleStateChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
          >
            {Object.keys(AAMVA_STATES)
              .sort()
              .map((code) => {
                const meta = AAMVA_STATES[code];
                const supported = isJurisdictionSupported(code);
                return (
                  <option key={code} value={code} disabled={!supported}>
                    {code} — {meta.name} {!supported && '(unsupported)'}
                  </option>
                );
              })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AAMVA Version</label>
          <select
            value={version}
            onChange={handleVersionChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
          >
            {Object.keys(AAMVA_VERSIONS).map((v) => (
              <option key={v} value={v}>
                {v} — {AAMVA_VERSIONS[v].name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subfile Type</label>
          <select
            value={subfileType}
            onChange={(e) => setSubfileType(e.target.value as 'DL' | 'ID')}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
          >
            <option value="DL">Driver's License (DL)</option>
            <option value="ID">Identification Card (ID)</option>
          </select>
        </div>

        <div className="flex items-center pt-2">
          <input
            id="strictMode"
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="strictMode" className="ml-2 block text-sm text-gray-900">
            Strict Compliance Mode
          </label>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Schema Info</h3>
        <p className="text-xs text-gray-500">
          Total Fields: {fields.length} <br />
          Required: {requiredCount}
        </p>
      </div>
    </div>
  );
};