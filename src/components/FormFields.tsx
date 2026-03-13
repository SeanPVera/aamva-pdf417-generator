import React from 'react';
import { useFormStore } from '../hooks/useFormStore';
import { getFieldsForStateAndVersion } from '../core/schema';
import { validateFieldValue, AAMVA_STATE_RULES } from '../core/validation';
import { generateStateDiscriminator, generateStateLicenseNumber, generateStateCardRevisionDate } from '../core/generator';

export const FormFields: React.FC = () => {
  const { state, version, strictMode, fields: storeFields, setField } = useFormStore();

  const schemaFields = getFieldsForStateAndVersion(state, version);

  const handleChange = (code: string, value: string) => {
    setField(code, value);
  };

  const handleGenerate = (code: string) => {
    if (code === 'DCF') {
      handleChange(code, generateStateDiscriminator(state));
    } else if (code === 'DAQ') {
      handleChange(code, generateStateLicenseNumber(state));
    } else if (code === 'DDB') {
      handleChange(code, generateStateCardRevisionDate(state, storeFields['DBD']) || '');
    }
  };

  return (
    <div className="flex-1 bg-white p-6 overflow-y-auto shadow-sm rounded-md border border-gray-200 m-4">
      <h2 className="text-xl font-semibold mb-6 border-b pb-2">Payload Fields</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemaFields.map((field) => {
          const value = storeFields[field.code] || '';
          const isValid = validateFieldValue(field, value, state, strictMode);
          const hasError = value && !isValid;

          return (
            <div key={field.code} className={`flex flex-col ${field.required ? 'border-l-4 border-blue-500 pl-3' : 'pl-4'}`}>
              <label htmlFor={field.code} className="text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>{field.code} — {field.label}</span>
                {field.required && <span className="text-red-500 text-xs">*</span>}
              </label>

              {field.options ? (
                <select
                  id={field.code}
                  value={value}
                  onChange={(e) => handleChange(field.code, e.target.value)}
                  className={`border rounded p-2 text-sm focus:ring-blue-500 ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <div className="flex space-x-2 relative">
                  <input
                    type="text"
                    id={field.code}
                    value={value}
                    placeholder={field.dateFormat || 'MMDDYYYY'}
                    onChange={(e) => handleChange(field.code, e.target.value)}
                    maxLength={8}
                    className={`flex-1 border rounded p-2 text-sm focus:ring-blue-500 ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {field.code === 'DDB' && (
                    <button
                      type="button"
                      onClick={() => handleGenerate(field.code)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2"
                    >
                      Gen
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex space-x-2 relative">
                  <input
                    type="text"
                    id={field.code}
                    value={value}
                    onChange={(e) => handleChange(field.code, e.target.value)}
                    className={`flex-1 border rounded p-2 text-sm focus:ring-blue-500 ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {(field.code === 'DCF' || field.code === 'DAQ') && (
                    <button
                      type="button"
                      onClick={() => handleGenerate(field.code)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2"
                    >
                      Gen
                    </button>
                  )}
                  {(field.code === 'DCB' || field.code === 'DCD') && (
                    <button
                      type="button"
                      onClick={() => handleChange(field.code, 'NONE')}
                      className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2"
                    >
                      None
                    </button>
                  )}
                </div>
              )}
              {hasError && <span className="text-red-500 text-xs mt-1">Invalid format or length</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};