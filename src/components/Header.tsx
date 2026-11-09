import React, { useEffect, useRef, useState } from "react";
import { Undo2, Redo2, ChevronDown } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { useToast } from "./Toast";
import { buildExportBasename } from "../core/exportNaming";
import { downloadBlob } from "../core/download";
import { ImportRecordDialog } from "./ImportRecordDialog";
import { InstallPrompt } from "./InstallPrompt";
import { loadQuickFillPresets, type QuickFillPreset } from "../core/presets";
import { useModalShell } from "../hooks/useModalShell";

interface HeaderProps {
  onStartScan: () => void;
  onOpenShortcuts: () => void;
  onOpenCompare: () => void;
  onOpenBatch: () => void;
  onOpenVersions: () => void;
  onOpenBadges?: () => void;
  onOpenBingo?: () => void;
  onOpenRoadTest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onStartScan,
  onOpenShortcuts,
  onOpenCompare,
  onOpenBatch,
  onOpenVersions
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [presets, setPresets] = useState<QuickFillPreset[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!moreOpen) return;
    let live = true;
    void loadQuickFillPresets()
      .then((items) => {
        if (live) setPresets(items);
      })
      .catch(() => {
        if (live) toast.error("Sample records could not be loaded.");
      });
    const dismiss = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
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
  }, [moreOpen, toast]);

  const run = (fn: () => void) => {
    setMoreOpen(false);
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
              AAMVA<span className="wordmark-divider">/</span>PDF417
            </h1>
            <span className="product-caption">inspector · session · memory-only</span>
          </div>
        </div>
        <div className="command-cluster header-actions">
          <InstallPrompt />
          <div className="history-actions" role="group" aria-label="Record history">
            <button
              className="wb-button chrome icon-button"
              onClick={undo}
              disabled={!_history.length}
              aria-label="Undo"
              title="Undo · Ctrl/⌘ Z"
            >
              <Undo2 size={14} />
            </button>
            <button
              className="wb-button chrome icon-button"
              onClick={redo}
              disabled={!_future.length}
              aria-label="Redo"
              title="Redo · Ctrl/⌘ Shift Z"
            >
              <Redo2 size={14} />
            </button>
          </div>
          <button
            className="wb-button chrome"
            onClick={() => setImportOpen(true)}
            title="Import record from JSON or barcode data"
          >
            import
          </button>
          <button
            className="wb-button chrome"
            onClick={onStartScan}
            title="Scan barcode using camera or image file"
          >
            scan
          </button>
          <button
            className="wb-button chrome"
            onClick={onOpenCompare}
            title="Side-by-side payload comparison"
          >
            compare
          </button>
          <button
            className="wb-button chrome"
            onClick={onOpenBatch}
            title="Process multiple records from CSV/JSON"
          >
            batch
          </button>
          <button
            className="wb-button chrome"
            onClick={onOpenVersions}
            title="Browse AAMVA version reference"
          >
            versions
          </button>
          <div className="tools-menu" ref={menuRef}>
            <button
              ref={triggerRef}
              className="wb-button chrome"
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-controls="workspace-more"
              title="More workspace options"
            >
              more <ChevronDown size={12} aria-hidden />
            </button>
            {moreOpen && (
              <div className="tool-popover" id="workspace-more" aria-label="More tools">
                <button type="button" onClick={() => run(exportRecord)} title="Save record JSON">
                  Export record JSON
                </button>
                <button
                  type="button"
                  onClick={() => run(onOpenShortcuts)}
                  title="Keyboard shortcuts"
                >
                  Keyboard shortcuts & help
                </button>
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
                      type="button"
                      title={`Load ${preset.label} synthetic record`}
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
                  type="button"
                  className="danger-text"
                  title="Clear all fields and reset undo history"
                  onClick={() => {
                    setMoreOpen(false);
                    setClearOpen(true);
                  }}
                >
                  Erase record & history…
                </button>
              </div>
            )}
          </div>
          <button
            className="wb-button chrome primary"
            onClick={() => exportRecord()}
            title="Export record JSON"
          >
            export ▾
          </button>
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
