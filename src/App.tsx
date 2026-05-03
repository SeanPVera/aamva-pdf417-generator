import React from "react";
import { Copy, X as XIcon } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { CompareView } from "./components/CompareView";
import { useToast } from "./components/Toast";
import { useFormStore } from "./hooks/useFormStore";
import { getFieldsForStateAndVersion, AAMVA_FIELD_LIMITS } from "./core/schema";
import { evaluateFieldValue } from "./core/validation";
import { applyStateThemeToDocument } from "./core/stateThemes";
import {
  generateStateDiscriminator,
  generateStateLicenseNumber,
  generateStateCardRevisionDate
} from "./core/generator";

// Heavy bundles (bwip-js ~250kB, jspdf ~150kB, zxing ~170kB) are loaded on
// demand so the initial paint doesn't pay for tooling the user may never open.
const WebcamScanner = React.lazy(() =>
  import("./components/WebcamScanner").then((module) => ({ default: module.WebcamScanner }))
);
const BarcodePreview = React.lazy(() =>
  import("./components/BarcodePreview").then((module) => ({ default: module.BarcodePreview }))
);
const BatchProcessor = React.lazy(() =>
  import("./components/BatchProcessor").then((module) => ({ default: module.BatchProcessor }))
);

function App() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [mobilePanel, setMobilePanel] = React.useState<"config" | "form" | "preview">("form");
  const { state, version, strictMode, fields, setField, theme, undo, redo, canUndo, canRedo } =
    useFormStore();
  const schemaFields = getFieldsForStateAndVersion(state, version);
  const toast = useToast();

  // Apply global theme + state palette to <html> element
  React.useEffect(() => {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    if (theme === "dmv") {
      html.setAttribute("data-theme", "dmv");
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme]);

  // Apply the jurisdiction-specific palette whenever the selected state
  // changes. The palette is exposed as CSS custom properties on <html>
  // (consumed by `header.state-themed`, `.state-themed-*` rules, etc.).
  React.useEffect(() => {
    applyStateThemeToDocument(state);
  }, [state]);

  // Keyboard shortcuts:
  //  Ctrl/Cmd + Z          = undo
  //  Ctrl/Cmd + Shift + Z  = redo
  //  Ctrl + Y              = redo
  //  ?                     = open shortcuts cheat sheet
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

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

  const handleCopyField = async (code: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error(`Could not copy ${code}`);
    }
  };

  const handleResetField = (code: string) => {
    handleChange(code, "");
    toast.info(`Reset ${code}`);
  };

  const handleScrollToField = (code: string) => {
    // On mobile, the form column may be hidden — switch to it first.
    setMobilePanel("form");
    // Defer to allow the panel to become visible.
    requestAnimationFrame(() => {
      const el = document.getElementById(code);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    });
  };

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-200 font-sans">
      <Header
        onStartScan={() => setIsScanning(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCompare={() => setCompareOpen(true)}
      />

      <nav
        className="lg:hidden z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 pb-2 pt-1"
        aria-label="Mobile panel navigation"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "config", label: "Config" },
            { key: "form", label: "Fields" },
            { key: "preview", label: "Preview" }
          ].map((panel) => (
            <button
              key={panel.key}
              type="button"
              onClick={() => setMobilePanel(panel.key as "config" | "form" | "preview")}
              aria-current={mobilePanel === panel.key}
              className={`state-themed-tab rounded-md px-3 py-2 text-sm font-medium transition ${
                mobilePanel === panel.key
                  ? "state-primary-bg text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex flex-1 flex-col lg:flex-row overflow-visible lg:overflow-hidden gap-0 lg:gap-0 pb-safe">
        <Sidebar mobileHidden={mobilePanel !== "config"} />

        <div
          className={`dmv-main flex-1 flex flex-col overflow-y-auto bg-white dark:bg-[#1E1E1E] m-2 lg:m-4 rounded-xl shadow-google dark:shadow-none border border-gray-200 dark:border-[#333333] min-h-[40vh] ${
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
              const evalResult = evaluateFieldValue(field, value, state, strictMode);
              const isWarning = !!value && evalResult.severity === "warning";
              const hasError = !!value && !evalResult.ok && !isWarning;
              const showAdvisory = hasError || isWarning;
              const errorId = `error-${field.code}`;
              const maxLen = AAMVA_FIELD_LIMITS[field.code] || (field.type === "date" ? 8 : undefined);
              const isResettable =
                field.code === "DCF" || field.code === "DAQ" || field.code === "DDB";

              // Google Material Design style base classes
              const baseInputClass =
                "block w-full px-3 pt-5 pb-2 text-sm text-gray-900 bg-gray-100 dark:bg-[#2C2C2C] border-0 border-b-2 appearance-none dark:text-gray-100 focus:outline-none focus:ring-0 peer transition-all duration-200 ease-in-out rounded-t-md pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500";
              const normalClass = `${baseInputClass} border-gray-300 dark:border-[#555] focus:border-brand-500`;
              const errorClass = `${baseInputClass} border-red-500 focus:border-red-500`;
              const warningClass = `${baseInputClass} border-amber-500 focus:border-amber-500`;
              const finalClass = hasError ? errorClass : isWarning ? warningClass : normalClass;

              const labelClass = `absolute text-sm duration-300 transform top-4 z-10 origin-[0] left-3 pointer-events-none ${
                hasError
                  ? "text-red-500"
                  : isWarning
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-gray-400 peer-focus:text-brand-500 peer-focus:dark:text-brand-400"
              } truncate w-[85%]`;

              const copyIcon = value ? (
                <button
                  type="button"
                  onClick={() => handleCopyField(field.code, value)}
                  aria-label={`Copy ${field.code} value`}
                  title={`Copy ${field.code}`}
                  className="field-hover-action absolute -top-1 right-1 z-30 p-1 rounded text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Copy size={12} />
                </button>
              ) : null;

              return (
                <div key={field.code} className="flex flex-col relative group">
                  {copyIcon}
                  {field.options ? (
                    <div className="relative">
                      <select
                        id={field.code}
                        value={value}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={showAdvisory ? errorId : undefined}
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
                        maxLength={maxLen}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={showAdvisory ? errorId : undefined}
                        className={`${finalClass} float-label-input`}
                      />
                      {maxLen && (
                        <span className="text-[9px] text-gray-400 absolute bottom-1.5 right-2 opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none font-mono z-30">
                          {value.length}/{maxLen}
                        </span>
                      )}
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
                        {field.code === "DDB" && (
                          <button
                            type="button"
                            onClick={() => handleGenerate(field.code)}
                            className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            title="Generate Card Revision Date"
                            aria-label="Generate Card Revision Date"
                          >
                            Gen
                          </button>
                        )}
                        {isResettable && value && (
                          <button
                            type="button"
                            onClick={() => handleResetField(field.code)}
                            aria-label={`Reset ${field.code}`}
                            title={`Reset ${field.code}`}
                            className="flex items-center justify-center w-5 bg-gray-200 hover:bg-red-100 dark:bg-[#444] dark:hover:bg-red-900/40 rounded text-gray-700 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-400 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          >
                            <XIcon size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex">
                      <input
                        type="text"
                        id={field.code}
                        value={value}
                        placeholder={field.dateFormat || " "}
                        onChange={(e) => handleChange(field.code, e.target.value)}
                        maxLength={maxLen}
                        aria-required={field.required}
                        aria-invalid={hasError}
                        aria-describedby={showAdvisory ? errorId : undefined}
                        className={`${finalClass} float-label-input`}
                      />
                      {maxLen && (
                        <span className="text-[9px] text-gray-400 absolute bottom-1.5 right-2 opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none font-mono z-30">
                          {value.length}/{maxLen}
                        </span>
                      )}
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
                            className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            title={`Generate ${field.label}`}
                            aria-label={`Generate ${field.label}`}
                          >
                            Gen
                          </button>
                        )}
                        {(field.code === "DCB" || field.code === "DCD") && (
                          <button
                            type="button"
                            onClick={() => handleChange(field.code, "NONE")}
                            className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            title={`Set ${field.label} to NONE`}
                            aria-label={`Set ${field.label} to NONE`}
                          >
                            None
                          </button>
                        )}
                        {isResettable && value && (
                          <button
                            type="button"
                            onClick={() => handleResetField(field.code)}
                            aria-label={`Reset ${field.code}`}
                            title={`Reset ${field.code}`}
                            className="flex items-center justify-center w-5 bg-gray-200 hover:bg-red-100 dark:bg-[#444] dark:hover:bg-red-900/40 rounded text-gray-700 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-400 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          >
                            <XIcon size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {showAdvisory && (
                    <span
                      id={errorId}
                      role={hasError ? "alert" : "status"}
                      data-severity={hasError ? "error" : "warning"}
                      className={`mt-1 text-[10px] font-medium absolute -bottom-4 left-0 ${
                        hasError ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {evalResult.message ||
                        (hasError
                          ? `Invalid format${field.dateFormat ? ` (e.g. ${field.dateFormat})` : ""}`
                          : "Advisory")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-auto">
            <React.Suspense fallback={null}>
              <BatchProcessor />
            </React.Suspense>
          </div>
        </div>

        <React.Suspense fallback={null}>
          <BarcodePreview
            mobileHidden={mobilePanel !== "preview"}
            onScrollToField={handleScrollToField}
          />
        </React.Suspense>
      </main>

      {isScanning && (
        <React.Suspense fallback={null}>
          <WebcamScanner onClose={() => setIsScanning(false)} />
        </React.Suspense>
      )}

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CompareView open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}

export default App;
