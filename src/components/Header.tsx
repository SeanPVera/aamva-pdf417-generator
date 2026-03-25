import React, { useRef } from "react";
import {
  ShieldCheck,
  Camera,
  Download,
  Upload,
  Trash2,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Building2
} from "lucide-react";
import { useFormStore, Theme } from "../hooks/useFormStore";

interface HeaderProps {
  onStartScan: () => void;
}

const THEME_LABELS: Record<Theme, { label: string; icon: React.ReactNode }> = {
  light: { label: "Light", icon: <Sun size={13} /> },
  dark: { label: "Dark", icon: <Moon size={13} /> },
  dmv: { label: "DMV", icon: <Building2 size={13} /> }
};

const THEMES: Theme[] = ["light", "dark", "dmv"];

export const Header: React.FC<HeaderProps> = ({ onStartScan }) => {
  const {
    clearFields,
    fields,
    state,
    version,
    loadJson,
    theme,
    setTheme,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFormStore();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const data = { state, version, ...fields };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aamva_${state}_${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          loadJson(parsed as Record<string, string>);
        } else {
          alert("Invalid JSON: expected a single payload object.");
        }
      } catch {
        alert("Failed to parse JSON file. Check the file format.");
      }
    };
    reader.readAsText(file);
    // reset so the same file can be re-imported
    e.target.value = "";
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all PII from memory?")) {
      clearFields();
      // Must match the persist name in useFormStore
      localStorage.removeItem("aamva_form_data_secure");
    }
  };

  return (
    <header className="bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 shadow-sm border-b border-gray-200 dark:border-dark-border z-10 sticky top-0 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center space-x-3 shrink-0">
        <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <h1 className="text-lg font-bold tracking-wide whitespace-nowrap">
          AAMVA PDF417 Generator
        </h1>
        <span className="dmv-badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs py-0.5 px-2 rounded-full border border-brand-200 dark:border-brand-800/50 whitespace-nowrap">
          Professional Grade
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
          aria-label="Undo last field change"
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo field change"
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Redo2 size={15} />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-dark-border mx-1" />

        {/* Theme toggle */}
        <div className="flex items-center rounded overflow-hidden border border-gray-200 dark:border-dark-border focus-within:ring-2 focus-within:ring-brand-500">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              title={`${THEME_LABELS[t].label} theme`}
              aria-pressed={theme === t}
              className={`flex items-center gap-1 px-2 py-1.5 text-xs transition focus:outline-none ${
                theme === t
                  ? "bg-blue-500 font-semibold text-white"
                  : "hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300"
              }`}
            >
              {THEME_LABELS[t].icon}
              <span className="hidden sm:inline">{THEME_LABELS[t].label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-dark-border mx-1" />

        {/* Scan */}
        <button
          onClick={onStartScan}
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Scan Barcode from Webcam"
          aria-label="Open barcode scanner"
        >
          <Camera size={15} />
          <span className="hidden sm:inline">Scan ID</span>
        </button>

        {/* Import JSON */}
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportJson}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Import JSON Profile"
          aria-label="Import JSON payload file"
        >
          <Upload size={15} />
          <span className="hidden sm:inline">Import JSON</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Export JSON Profile"
          aria-label="Export current fields as JSON"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export JSON</span>
        </button>

        {/* Clear PII */}
        <button
          onClick={handleClearData}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
          title="Securely Clear Memory"
          aria-label="Clear all PII from memory and storage"
        >
          <Trash2 size={15} />
          <span className="hidden sm:inline">Clear PII</span>
        </button>
      </div>
    </header>
  );
};
