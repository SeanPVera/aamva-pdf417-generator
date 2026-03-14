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
    <header className="bg-blue-700 text-white shadow-md z-10 sticky top-0 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center space-x-3 shrink-0">
        <ShieldCheck className="h-5 w-5" />
        <h1 className="text-lg font-bold tracking-wide whitespace-nowrap">
          AAMVA PDF417 Generator
        </h1>
        <span className="dmv-badge bg-blue-800 text-xs py-0.5 px-2 rounded-full border border-blue-600 whitespace-nowrap">
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
          className="flex items-center gap-1 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded transition text-sm"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo field change"
          className="flex items-center gap-1 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded transition text-sm"
        >
          <Redo2 size={15} />
        </button>

        <div className="w-px h-5 bg-blue-500 mx-1" />

        {/* Theme toggle */}
        <div className="flex items-center rounded overflow-hidden border border-blue-500">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              title={`${THEME_LABELS[t].label} theme`}
              aria-pressed={theme === t}
              className={`flex items-center gap-1 px-2 py-1.5 text-xs transition ${
                theme === t ? "bg-blue-500 font-semibold" : "hover:bg-blue-600"
              }`}
            >
              {THEME_LABELS[t].icon}
              <span className="hidden sm:inline">{THEME_LABELS[t].label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-blue-500 mx-1" />

        {/* Scan */}
        <button
          onClick={onStartScan}
          className="flex items-center gap-1 hover:bg-blue-600 px-2 py-1.5 rounded transition text-sm"
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
        />
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1 hover:bg-blue-600 px-2 py-1.5 rounded transition text-sm"
          title="Import JSON Profile"
          aria-label="Import JSON payload file"
        >
          <Upload size={15} />
          <span className="hidden sm:inline">Import JSON</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1 hover:bg-blue-600 px-2 py-1.5 rounded transition text-sm"
          title="Export JSON Profile"
          aria-label="Export current fields as JSON"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export JSON</span>
        </button>

        {/* Clear PII */}
        <button
          onClick={handleClearData}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-2 py-1.5 rounded transition text-sm"
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
