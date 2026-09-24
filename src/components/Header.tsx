import React, { useEffect, useRef, useState } from "react";
import { Undo2, Redo2, ChevronDown } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { useToast } from "./Toast";
import { buildExportBasename } from "../core/exportNaming";
import { downloadBlob } from "../core/download";
import { ImportRecordDialog } from "./ImportRecordDialog";
import { InstallPrompt } from "./InstallPrompt";
import { loadQuickFillPresets, type QuickFillPreset } from "../core/presets";

interface HeaderProps {
  onStartScan: () => void;
  onOpenShortcuts: () => void;
  onOpenCompare: () => void;
  onOpenBatch: () => void;
  onOpenBadges?: () => void;
  onOpenBingo?: () => void;
  onOpenRoadTest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onStartScan,
  onOpenShortcuts,
  onOpenCompare,
  onOpenBatch
}) => {
  const {
    state,
    version,
    subfileType,
    fields,
    theme,
    setTheme,
    clearFields,
    loadJson,
    undo,
    redo,
    _history,
    _future,
    includeNameInExport
  } = useFormStore();
  const [importOpen, setImportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [presets, setPresets] = useState<QuickFillPreset[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!toolsOpen) return;
    let live = true;
    void loadQuickFillPresets()
      .then((items) => {
        if (live) setPresets(items);
      })
      .catch(() => {
        if (live) toast.error("Sample records could not be loaded.");
      });
    const dismiss = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setToolsOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToolsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      live = false;
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [toolsOpen, toast]);

  const run = (fn: () => void) => {
    setToolsOpen(false);
    triggerRef.current?.focus();
    fn();
  };
  const exportRecord = () => {
    const text = JSON.stringify({ state, version, subfileType, ...fields }, null, 2);
    downloadBlob(
      new Blob([text], { type: "application/json" }),
      buildExportBasename({
        state,
        version,
        subfileType,
        fields,
        includeName: includeNameInExport,
        prefix: "record"
      }) + ".json"
    );
  };

  return (
    <>
      <a className="skip-link" href="#record-workspace">
        Skip to record
      </a>
      <header className="workbench-header header-safe-top">
        <div className="product-wordmark">
          <span className="barcode-mark" aria-hidden="true" />
          <div>
            <h1>
              AAMVA<span className="wordmark-divider"> / </span>PDF417
            </h1>
            <span className="product-caption">Record workbench</span>
          </div>
        </div>
        <div className="header-actions">
          <InstallPrompt />
          <div className="history-actions" role="group" aria-label="Record history">
            <button
              className="wb-button icon-button"
              onClick={undo}
              disabled={!_history.length}
              aria-label="Undo"
              title="Undo · Ctrl/⌘ Z"
            >
              <Undo2 size={17} />
            </button>
            <button
              className="wb-button icon-button"
              onClick={redo}
              disabled={!_future.length}
              aria-label="Redo"
              title="Redo · Ctrl/⌘ Shift Z"
            >
              <Redo2 size={17} />
            </button>
          </div>
          <button className="wb-button" onClick={() => setImportOpen(true)}>
            Import
          </button>
          <button className="wb-button primary" onClick={onStartScan}>
            Scan barcode
          </button>
          <div className="tools-menu" ref={menuRef}>
            <button
              ref={triggerRef}
              className="wb-button"
              onClick={() => setToolsOpen(!toolsOpen)}
              aria-expanded={toolsOpen}
              aria-controls="workspace-tools"
            >
              Tools <ChevronDown size={14} aria-hidden />
            </button>
            {toolsOpen && (
              <div className="tool-popover" id="workspace-tools" aria-label="Workspace tools">
                <button onClick={() => run(exportRecord)}>Export record JSON</button>
                <button onClick={() => run(onOpenCompare)}>Compare payloads</button>
                <button onClick={() => run(onOpenBatch)}>Batch CSV processing</button>
                <button onClick={() => run(onOpenShortcuts)}>Keyboard shortcuts & help</button>
                <label className="menu-setting">
                  Appearance
                  <select
                    aria-label="Appearance"
                    value={theme === "dmv" ? "light" : theme}
                    onChange={(e) => setTheme(e.target.value as "system" | "light" | "dark")}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <details className="sample-menu">
                  <summary>Synthetic sample records</summary>
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        run(() => {
                          loadJson({
                            state: preset.state,
                            version: preset.version,
                            subfileType: "DL",
                            ...preset.fields
                          });
                          toast.success(
                            "Synthetic record loaded. Undo is available in the toolbar."
                          );
                        })
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </details>
                <button
                  className="danger-text"
                  onClick={() => {
                    setToolsOpen(false);
                    setClearOpen(true);
                  }}
                >
                  Erase record & history…
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {importOpen && <ImportRecordDialog onClose={() => setImportOpen(false)} />}
      {clearOpen && (
        <EraseDialog
          onCancel={() => setClearOpen(false)}
          onErase={() => {
            clearFields();
            setClearOpen(false);
            toast.info(
              "Record and undo history erased. Downloaded files and clipboard contents are unchanged."
            );
          }}
        />
      )}
    </>
  );
};

import { useModalShell } from "../hooks/useModalShell";
function EraseDialog({ onCancel, onErase }: { onCancel: () => void; onErase: () => void }) {
  const ref = useModalShell({ open: true, onClose: onCancel });
  return (
    <div className="modal-backdrop">
      <div
        ref={ref}
        className="wb-dialog compact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="erase-title"
        tabIndex={-1}
      >
        <h2 id="erase-title">Erase this record?</h2>
        <p>
          This removes the current fields, imported source, and undo history from the workspace. It
          cannot be undone.
        </p>
        <div className="dialog-actions">
          <button className="wb-button" onClick={onCancel}>
            Keep record
          </button>
          <button className="wb-button danger" onClick={onErase}>
            Erase record
          </button>
        </div>
      </div>
    </div>
  );
}
