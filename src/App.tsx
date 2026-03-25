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
  const [mobilePanel, setMobilePanel] = React.useState<"config" | "form" | "preview">("form");
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-200 font-sans">
      <Header onStartScan={() => setIsScanning(true)} />

      <nav
        className="lg:hidden sticky top-[60px] z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        aria-label="Mobile panel navigation"
      >
        <div className="grid grid-cols-3 gap-2 p-2">
          {[
            { key: "config", label: "Config" },
            { key: "form", label: "Fields" },
            { key: "preview", label: "Preview" }
          ].map((panel) => (
            <button
              key={panel.key}
              type="button"
              onClick={() => setMobilePanel(panel.key as "config" | "form" | "preview")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mobilePanel === panel.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex flex-1 flex-col lg:flex-row overflow-visible lg:overflow-hidden gap-0 lg:gap-0">
        <Sidebar mobileHidden={mobilePanel !== "config"} />

        <div
          className={`dmv-main flex-1 flex flex-col overflow-y-auto bg-white dark:bg-[#1E1E1E] m-2 lg:m-4 rounded-xl shadow-google dark:shadow-none border border-gray-200 dark:border-[#333333] ${
            mobilePanel !== "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Payload Fields
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              AAMVA Version {version} &bull; {state}
            </div>
          </div>

          <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
            {schemaFields.map((field) => {
              const value = fields[field.code] || "";
              const isValid = validateFieldValue(field, value, state, strictMode);
              const hasError = !!(value && !isValid);
              const errorId = `error-${field.code}`;

              // Google Material Design style base classes
              const baseInputClass =
                "block w-full px-3 pt-5 pb-2 text-sm text-gray-900 bg-gray-100 dark:bg-[#2C2C2C] border-0 border-b-2 appearance-none dark:text-gray-100 focus:outline-none focus:ring-0 peer transition-all duration-200 ease-in-out rounded-t-md pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500";
              const normalClass = `${baseInputClass} border-gray-300 dark:border-[#555] focus:border-brand-500`;
              const errorClass = `${baseInputClass} border-red-500 focus:border-red-500`;
              const finalClass = hasError ? errorClass : normalClass;

              const labelClass = `absolute text-sm duration-300 transform top-4 z-10 origin-[0] left-3 pointer-events-none ${
                hasError
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400 peer-focus:text-brand-500 peer-focus:dark:text-brand-400"
              } truncate w-[85%]`;

              return (
                <div key={field.code} className="flex flex-col relative group">
                  {field.options ? (
                    <div className="relative">
                      <select
                        id={field.code}
                        value={value}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? errorId : undefined}
                        className={finalClass + (value ? "" : " text-transparent")}
                      >
                        <option value="" disabled className="text-gray-500 dark:text-gray-400">
                          Select...
                        </option>
                        {field.options.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-surface"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <label
                        htmlFor={field.code}
                        className={labelClass.replace(
                          "transform top-4",
                          "transform -translate-y-3 scale-75 top-4"
                        )}
                      >
                        {field.code} — {field.label}{" "}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                    </div>
                  ) : field.type === "date" ? (
                    <div className="relative flex">
                      <input
                        type="text"
                        id={field.code}
                        value={value}
                        placeholder={field.dateFormat || " "}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        maxLength={8}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? errorId : undefined}
                        className={`${finalClass} float-label-input`}
                      />
                      <label
                        htmlFor={field.code}
                        className={labelClass.replace(
                          "transform top-4",
                          "transform -translate-y-3 scale-75 top-4"
                        )}
                      >
                        {field.code} — {field.label}{" "}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.code === "DDB" && (
                        <button
                          type="button"
                          onClick={() => handleGenerate(field.code)}
                          className="absolute right-1.5 top-2 bottom-2 text-[10px] font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors z-20 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          title="Generate Card Revision Date"
                        >
                          Gen
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative flex">
                      <input
                        type="text"
                        id={field.code}
                        value={value}
                        placeholder={field.dateFormat || " "}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? errorId : undefined}
                        className={`${finalClass} float-label-input`}
                      />
                      <label
                        htmlFor={field.code}
                        className={labelClass.replace(
                          "transform top-4",
                          "transform -translate-y-3 scale-75 top-4"
                        )}
                      >
                        {field.code} — {field.label}{" "}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="absolute right-1.5 top-2 bottom-2 flex gap-1 z-20">
                        {(field.code === "DCF" || field.code === "DAQ") && (
                          <button
                            type="button"
                            onClick={() => handleGenerate(field.code)}
                            className="text-[10px] font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          >
                            Gen
                          </button>
                        )}
                        {(field.code === "DCB" || field.code === "DCD") && (
                          <button
                            type="button"
                            onClick={() => handleChange(field.code, "NONE")}
                            className="text-[10px] font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          >
                            None
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {hasError && (
                    <span
                      id={errorId}
                      role="alert"
                      className="mt-1 text-red-500 text-[10px] font-medium absolute -bottom-4 left-0"
                    >
                      Invalid format {field.dateFormat ? `(e.g. ${field.dateFormat})` : ""}
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

        <BarcodePreview mobileHidden={mobilePanel !== "preview"} />
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
