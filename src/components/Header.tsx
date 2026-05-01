import React, { useEffect, useRef, useState } from "react";
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
  Building2,
  Sparkles,
  Keyboard,
  GitCompare,
  ChevronDown
} from "lucide-react";
import { useFormStore, Theme } from "../hooks/useFormStore";
import { InstallPrompt } from "./InstallPrompt";
import { useToast } from "./Toast";
import { QUICK_FILL_PRESETS } from "../core/presets";

interface HeaderProps {
  onStartScan: () => void;
  onOpenShortcuts: () => void;
  onOpenCompare: () => void;
}

const THEME_LABELS: Record<Theme, { label: string; icon: React.ReactNode }> = {
  light: { label: "Light", icon: <Sun size={13} /> },
  dark: { label: "Dark", icon: <Moon size={13} /> },
  dmv: { label: "DMV", icon: <Building2 size={13} /> }
};

const THEMES: Theme[] = ["light", "dark", "dmv"];

export const Header: React.FC<HeaderProps> = ({ onStartScan, onOpenShortcuts, onOpenCompare }) => {
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
  const presetsRef = useRef<HTMLDivElement>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!presetsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresetsOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [presetsOpen]);

  const handleExportJson = () => {
    const data = { state, version, ...fields };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aamva_${state}_${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${a.download}`);
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
          toast.success(`Imported ${file.name}`);
        } else {
          toast.error("Invalid JSON: expected a single payload object.");
        }
      } catch {
        toast.error("Failed to parse JSON file. Check the file format.");
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
      toast.success("Cleared all PII fields");
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = QUICK_FILL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    loadJson({ state: preset.state, version: preset.version, ...preset.fields });
    setPresetsOpen(false);
    toast.success(`Loaded preset: ${preset.label}`);
  };

  return (
    <header className="state-themed bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 shadow-sm border-b border-gray-200 dark:border-dark-border z-20 sticky top-0 px-3 sm:px-4 py-2.5">
      {/* Brand */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0">
          <ShieldCheck className="state-brand-icon h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />
          <h1 className="state-brand-text text-base sm:text-lg font-bold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
            AAMVA PDF417 Generator
          </h1>
          <span className="hidden sm:inline state-badge dmv-badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs py-0.5 px-2 rounded-full border border-brand-200 dark:border-brand-800/50 whitespace-nowrap">
            Professional Grade
          </span>
        </div>
        <InstallPrompt />
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1 header-toolbar">
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

        <div className="state-divider w-px h-5 bg-gray-200 dark:bg-dark-border mx-1" />

        {/* Theme toggle */}
        <div className="state-toggle-group flex items-center rounded overflow-hidden border border-gray-200 dark:border-dark-border focus-within:ring-2 focus-within:ring-brand-500">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              title={`${THEME_LABELS[t].label} theme`}
              aria-pressed={theme === t}
              className={`flex items-center gap-1 px-2 py-1.5 text-xs transition focus:outline-none ${
                theme === t
                  ? "state-primary-bg font-semibold text-white"
                  : "hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300"
              }`}
            >
              {THEME_LABELS[t].icon}
              <span className="hidden sm:inline">{THEME_LABELS[t].label}</span>
            </button>
          ))}
        </div>

        <div className="state-divider w-px h-5 bg-gray-200 dark:bg-dark-border mx-1" />

        {/* Quick Fill Presets */}
        <div className="relative" ref={presetsRef}>
          <button
            onClick={() => setPresetsOpen((v) => !v)}
            title="Quick fill from a preset profile"
            aria-haspopup="menu"
            aria-expanded={presetsOpen}
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">Presets</span>
            <ChevronDown size={12} />
          </button>
          {presetsOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-72 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md shadow-lg z-30 overflow-hidden"
            >
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                Quick Fill Presets
              </div>
              <ul>
                {QUICK_FILL_PRESETS.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleApplyPreset(p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-sm text-gray-800 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-dark-surface2"
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.description}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Compare */}
        <button
          onClick={onOpenCompare}
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Compare two payloads side-by-side"
          aria-label="Compare two payloads"
        >
          <GitCompare size={15} />
          <span className="hidden sm:inline">Compare</span>
        </button>

        <div className="state-divider w-px h-5 bg-gray-200 dark:bg-dark-border mx-1" />

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

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Keyboard shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard size={15} />
        </button>

        {/* Clear PII */}
        <button
          onClick={handleClearData}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
          title="Securely Clear Memory"
          aria-label="Clear all PII from memory and storage"
        >
          <Trash2 size={15} />
          <span className="whitespace-nowrap hidden sm:inline">Clear PII</span>
        </button>
      </div>
    </header>
  );
};
