import React from "react";
import { Sidebar } from "./components/Sidebar";
import { BarcodePreview } from "./components/BarcodePreview";
import { Header } from "./components/Header";
import { BatchProcessor } from "./components/BatchProcessor";
import { useFormStore } from "./hooks/useFormStore";
import { getFieldsForStateAndVersion } from "./core/schema";
import { validateFieldValue } from "./core/validation";
import {
  generateStateDiscriminator,
  generateStateLicenseNumber,
  generateStateCardRevisionDate
} from "./core/generator";

const WebcamScanner = React.lazy(() =>
  import("./components/WebcamScanner").then((module) => ({ default: module.WebcamScanner }))
);

function App() {
  const [isScanning, setIsScanning] = React.useState(false);
  const { state, version, strictMode, fields, setField, theme, undo, redo, canUndo, canRedo } =
    useFormStore();
  const schemaFields = getFieldsForStateAndVersion(state, version);

  // Apply theme class/attribute to <html> element
  React.useEffect(() => {
    const html = document.documentElement;
    // Tailwind dark mode via class
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    // DMV blue theme via data attribute
    if (theme === "dmv") {
      html.setAttribute("data-theme", "dmv");
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme]);

  // Keyboard shortcuts: Ctrl/Cmd + Z = undo, Ctrl/Cmd + Shift + Z or Ctrl + Y = redo
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === "z" && !e.shiftKey) {
        if (canUndo()) {
          e.preventDefault();
          undo();
        }
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        if (canRedo()) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, canUndo, canRedo]);

  const handleChange = (code: string, value: string) => {
    setField(code, value);
  };

  const handleGenerate = (code: string) => {
    if (code === "DCF") handleChange(code, generateStateDiscriminator(state));
    else if (code === "DAQ") handleChange(code, generateStateLicenseNumber(state));
    else if (code === "DDB")
      handleChange(code, generateStateCardRevisionDate(state, fields["DBD"]) || "");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header onStartScan={() => setIsScanning(true)} />

      <main className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="dmv-main flex-1 flex flex-col overflow-y-auto bg-white dark:bg-gray-800 m-4 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Payload Fields
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              AAMVA Version {version} &bull; {state}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {schemaFields.map((field) => {
              const value = fields[field.code] || "";
              const isValid = validateFieldValue(field, value, state, strictMode);
              const hasError = !!(value && !isValid);
              const errorId = `error-${field.code}`;

              return (
                <div key={field.code} className="flex flex-col relative group">
                  <label
                    htmlFor={field.code}
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex justify-between items-center"
                  >
                    <span>
                      {field.code} — {field.label}
                    </span>
                    {field.required && (
                      <span className="text-red-500" aria-hidden="true" title="Required">
                        *
                      </span>
                    )}
                  </label>

                  {field.options ? (
                    <select
                      id={field.code}
                      value={value}
                      onChange={(e) => handleChange(field.code, e.target.value)}
                      aria-required={field.required}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? errorId : undefined}
                      className={`border rounded p-2 text-sm focus:ring-blue-500 outline-none transition-shadow dark:bg-gray-700 dark:text-gray-100 ${
                        hasError
                          ? "border-red-500 bg-red-50 dark:bg-red-900/30 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-1"
                      }`}
                    >
                      <option value="">Select…</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "date" ? (
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        id={field.code}
                        value={value}
                        placeholder={field.dateFormat || "MMDDYYYY"}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        maxLength={8}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? errorId : undefined}
                        className={`flex-1 min-w-0 border rounded p-2 text-sm focus:ring-blue-500 outline-none transition-shadow dark:bg-gray-700 dark:text-gray-100 ${
                          hasError
                            ? "border-red-500 bg-red-50 dark:bg-red-900/30 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-1"
                        }`}
                      />
                      {field.code === "DDB" && (
                        <button
                          type="button"
                          onClick={() => handleGenerate(field.code)}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded px-2 text-gray-700 dark:text-gray-200 transition-colors"
                          title="Generate Card Revision Date"
                          aria-label={`Generate value for ${field.label}`}
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
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? errorId : undefined}
                        className={`flex-1 min-w-0 border rounded p-2 text-sm focus:ring-blue-500 outline-none transition-shadow dark:bg-gray-700 dark:text-gray-100 ${
                          hasError
                            ? "border-red-500 bg-red-50 dark:bg-red-900/30 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-1"
                        }`}
                      />
                      {(field.code === "DCF" || field.code === "DAQ") && (
                        <button
                          type="button"
                          onClick={() => handleGenerate(field.code)}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded px-2 text-gray-700 dark:text-gray-200 transition-colors"
                          title="Generate Auto Value"
                          aria-label={`Generate value for ${field.label}`}
                        >
                          Gen
                        </button>
                      )}
                      {(field.code === "DCB" || field.code === "DCD") && (
                        <button
                          type="button"
                          onClick={() => handleChange(field.code, "NONE")}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded px-2 text-gray-700 dark:text-gray-200 transition-colors"
                          title="Set to NONE"
                          aria-label={`Set ${field.label} to NONE`}
                        >
                          None
                        </button>
                      )}
                    </div>
                  )}

                  {hasError && (
                    <span
                      id={errorId}
                      role="alert"
                      className="mt-1 text-red-500 text-[10px] font-medium"
                    >
                      Invalid format
                    </span>
                  )}
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

      {isScanning && (
        <React.Suspense fallback={null}>
          <WebcamScanner onClose={() => setIsScanning(false)} />
        </React.Suspense>
      )}
    </div>
  );
}

export default App;
