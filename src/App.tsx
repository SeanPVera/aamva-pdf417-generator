import React from 'react';
import { Sidebar } from './components/Sidebar';
import { FormFields } from './components/FormFields';
import { BarcodePreview } from './components/BarcodePreview';
import { Header } from './components/Header';
import { BatchProcessor } from './components/BatchProcessor';
import { WebcamScanner } from './components/WebcamScanner';
import { useFormStore } from './hooks/useFormStore';
import { getFieldsForStateAndVersion } from './core/schema';
import { validateFieldValue } from './core/validation';
import { generateStateDiscriminator, generateStateLicenseNumber, generateStateCardRevisionDate } from './core/generator';

function App() {
  const [isScanning, setIsScanning] = React.useState(false);
  const { state, version, strictMode, fields, setField } = useFormStore();
  const schemaFields = getFieldsForStateAndVersion(state, version);

  const handleChange = (code: string, value: string) => {
    setField(code, value);
  };

  const handleGenerate = (code: string) => {
    if (code === 'DCF') handleChange(code, generateStateDiscriminator(state));
    else if (code === 'DAQ') handleChange(code, generateStateLicenseNumber(state));
    else if (code === 'DDB') handleChange(code, generateStateCardRevisionDate(state, fields['DBD']) || '');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <Header onStartScan={() => setIsScanning(true)} />

      <main className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-y-auto bg-white m-4 rounded shadow-sm border border-gray-200">
           <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Payload Fields</h2>
              <div className="text-sm text-gray-500 font-medium">
                AAMVA Version {version} • {state}
              </div>
           </div>

           <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {schemaFields.map((field) => {
              const value = fields[field.code] || '';
              const isValid = validateFieldValue(field, value, state, strictMode);
              const hasError = value && !isValid;

              return (
                <div key={field.code} className="flex flex-col relative group">
                  <label htmlFor={field.code} className="text-xs font-semibold text-gray-700 mb-1 flex justify-between items-center">
                    <span>{field.code} — {field.label}</span>
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.options ? (
                    <select
                      id={field.code}
                      value={value}
                      onChange={(e) => handleChange(field.code, e.target.value)}
                      className={`border rounded p-2 text-sm focus:ring-blue-500 outline-none transition-shadow ${hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-1'}`}
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        id={field.code}
                        value={value}
                        placeholder={field.dateFormat || 'MMDDYYYY'}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        maxLength={8}
                        className={`flex-1 min-w-0 border rounded p-2 text-sm focus:ring-blue-500 outline-none transition-shadow ${hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-1'}`}
                      />
                      {field.code === 'DDB' && (
                        <button
                          type="button"
                          onClick={() => handleGenerate(field.code)}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 text-gray-700 transition-colors"
                          title="Generate Card Revision Date"
                        >
                          Gen
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        id={field.code}
                        value={value}
                        placeholder={field.label}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        className={`flex-1 min-w-0 border rounded p-2 text-sm focus:ring-blue-500 outline-none transition-shadow ${hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-1'}`}
                      />
                      {(field.code === 'DCF' || field.code === 'DAQ') && (
                        <button
                          type="button"
                          onClick={() => handleGenerate(field.code)}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 text-gray-700 transition-colors"
                          title="Generate Auto Value"
                        >
                          Gen
                        </button>
                      )}
                      {(field.code === 'DCB' || field.code === 'DCD') && (
                        <button
                          type="button"
                          onClick={() => handleChange(field.code, 'NONE')}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 text-gray-700 transition-colors"
                          title="Set to NONE"
                        >
                          None
                        </button>
                      )}
                    </div>
                  )}
                  {hasError && <span className="absolute -bottom-4 left-0 text-red-500 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Invalid format</span>}
                </div>
              );
            })}
           </div>

           <div className="mt-auto">
             <BatchProcessor />
           </div>
        </div>

        <BarcodePreview />
      </main>

      {isScanning && <WebcamScanner onClose={() => setIsScanning(false)} />}
    </div>
  );
}

export default App;