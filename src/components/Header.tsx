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
  ChevronDown,
  PartyPopper,
  Volume2,
  VolumeX
} from "lucide-react";
import { useFormStore, Theme } from "../hooks/useFormStore";
import { InstallPrompt } from "./InstallPrompt";
import { useToast } from "./Toast";
import { QUICK_FILL_PRESETS } from "../core/presets";
import { getStateTheme } from "../core/stateThemes";
import { AAMVA_STATES } from "../core/states";
import { buildExportBasename } from "../core/exportNaming";

interface HeaderProps {
  onStartScan: () => void;
  onOpenShortcuts: () => void;
  onOpenCompare: () => void;
}

const THEME_LABELS: Record<
  Theme,
  { label: string; icon: React.ReactNode; description: string; swatch: string }
> = {
  light: {
    label: "Light",
    icon: <Sun size={13} />,
    description: "Light surfaces and dark text",
    swatch: "#ffffff"
  },
  dark: {
    label: "Dark",
    icon: <Moon size={13} />,
    description: "Dark surfaces and light text",
    swatch: "#1e1e1e"
  },
  dmv: {
    label: "DMV",
    icon: <Building2 size={13} />,
    description: "Jurisdiction-themed accents from the selected state's palette",
    swatch: "" // filled at render time from the current state palette
  }
};

const THEMES: Theme[] = ["light", "dark", "dmv"];

export const Header: React.FC<HeaderProps> = ({ onStartScan, onOpenShortcuts, onOpenCompare }) => {
  const {
    clearFields,
    fields,
    state,
    version,
    subfileType,
    loadJson,
    theme,
    setTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    whimsy,
    setWhimsy,
    soundOn,
    setSoundOn,
    _history,
    _future
  } = useFormStore();
  const importRef = useRef<HTMLInputElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const funRef = useRef<HTMLDivElement>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [funOpen, setFunOpen] = useState(false);
  const undoDepth = _history.length;
  const redoDepth = _future.length;
  const toast = useToast();
  const activeStateTheme = getStateTheme(state);
  const activeStateName = AAMVA_STATES[state]?.name ?? state;

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

  useEffect(() => {
    if (!funOpen) return;
    const onClick = (e: MouseEvent) => {
      if (funRef.current && !funRef.current.contains(e.target as Node)) {
        setFunOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFunOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [funOpen]);

  const handleExportJson = () => {
    const data = { state, version, ...fields };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      buildExportBasename({ state, version, fields, subfileType, prefix: "aamva" }) + ".json";
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
          toast.error("Invalid JSON: expected a single payload object.", { persistent: true });
        }
      } catch {
        toast.error("Failed to parse JSON file. Check the file format.", { persistent: true });
      }
    };
    reader.readAsText(file);
    // reset so the same file can be re-imported
    e.target.value = "";
  };

  const handleClearData = () => {
    const filledCount = Object.values(fields).filter((v) => (v ?? "").trim().length > 0).length;
    // PII lives only in memory — it is never persisted (see useFormStore), so
    // clearing the in-memory fields is the complete and honest cleanup.
    const prompt =
      filledCount > 0
        ? `Clear all ${filledCount} filled field${filledCount === 1 ? "" : "s"} from memory?`
        : "Clear the form? No fields are currently filled.";
    if (window.confirm(prompt)) {
      clearFields();
      toast.success(
        filledCount > 0
          ? `Cleared ${filledCount} field${filledCount === 1 ? "" : "s"}`
          : "Form cleared"
      );
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
    <header
      className="state-themed bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 shadow-sm border-b border-gray-200 dark:border-dark-border z-20 sticky top-0 px-3 sm:px-4 py-2.5"
      data-active-state={state}
      data-state-motif={activeStateTheme.motif}
    >
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
          <span
            className="jurisdiction-plate hidden md:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-sm whitespace-nowrap"
            title={`${activeStateName} theme package: ${activeStateTheme.motif}`}
          >
            {state} · {activeStateTheme.motif}
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
          title={`Undo (Ctrl+Z)${undoDepth ? ` — ${undoDepth} step${undoDepth === 1 ? "" : "s"}` : ""}`}
          aria-label={`Undo last field change${undoDepth ? ` (${undoDepth} available)` : ""}`}
          className="relative flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Undo2 size={15} />
          {undoDepth > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-brand-600 text-white text-[9px] leading-[14px] text-center font-semibold shadow"
            >
              {undoDepth > 9 ? "9+" : undoDepth}
            </span>
          )}
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          title={`Redo (Ctrl+Shift+Z)${redoDepth ? ` — ${redoDepth} step${redoDepth === 1 ? "" : "s"}` : ""}`}
          aria-label={`Redo field change${redoDepth ? ` (${redoDepth} available)` : ""}`}
          className="relative flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Redo2 size={15} />
          {redoDepth > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-brand-600 text-white text-[9px] leading-[14px] text-center font-semibold shadow"
            >
              {redoDepth > 9 ? "9+" : redoDepth}
            </span>
          )}
        </button>

        <div className="state-divider w-px h-5 bg-gray-200 dark:bg-dark-border mx-1" />

        {/* Theme toggle */}
        <div className="state-toggle-group flex items-center rounded overflow-hidden border border-gray-200 dark:border-dark-border focus-within:ring-2 focus-within:ring-brand-500">
          {THEMES.map((t) => {
            const meta = THEME_LABELS[t];
            const swatch = t === "dmv" ? getStateTheme(state).primary : meta.swatch;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                title={`${meta.label} theme — ${meta.description}`}
                aria-pressed={theme === t}
                className={`flex items-center gap-1.5 px-2 py-1.5 text-xs transition focus:outline-none ${
                  theme === t
                    ? "state-primary-bg font-semibold text-white"
                    : "hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  aria-hidden
                  className="inline-block w-3 h-3 rounded-full border border-black/15 shadow-sm"
                  style={{ backgroundColor: swatch }}
                />
                {meta.icon}
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            );
          })}
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

        {/* Fun / whimsy toggles */}
        <div className="relative" ref={funRef}>
          <button
            onClick={() => setFunOpen((v) => !v)}
            title="Playful extras"
            aria-haspopup="menu"
            aria-expanded={funOpen}
            aria-label="Toggle playful extras"
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <PartyPopper size={15} />
          </button>
          {funOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-64 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md shadow-lg z-30 overflow-hidden text-gray-800 dark:text-gray-100"
            >
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                Playful extras
              </div>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={whimsy}
                onClick={() => {
                  setWhimsy(!whimsy);
                  toast.info(whimsy ? "Whimsy off — all business." : "Whimsy on ✨");
                }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-sm focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-dark-surface2"
              >
                <span className="flex items-center gap-2">
                  <PartyPopper size={14} /> Whimsy effects
                </span>
                <span
                  aria-hidden
                  className={`text-xs font-semibold ${whimsy ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
                >
                  {whimsy ? "ON" : "OFF"}
                </span>
              </button>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={soundOn}
                onClick={() => {
                  setSoundOn(!soundOn);
                  toast.info(soundOn ? "Clerk sounds muted" : "Clerk sounds on 🔊");
                }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-surface2 text-sm focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-dark-surface2"
              >
                <span className="flex items-center gap-2">
                  {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />} Clerk sound FX
                </span>
                <span
                  aria-hidden
                  className={`text-xs font-semibold ${soundOn ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
                >
                  {soundOn ? "ON" : "OFF"}
                </span>
              </button>
              <p className="px-3 py-2 text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-dark-border">
                Cosmetic only — never affects the barcode. Psst: try the Konami code.
              </p>
            </div>
          )}
        </div>

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
