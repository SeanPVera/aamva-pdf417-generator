import React, { useRef, useState } from "react";
import { useModalShell } from "../hooks/useModalShell";
import { useFormStore } from "../hooks/useFormStore";
import { useToast } from "./Toast";
import { parsePastedPayload } from "../core/pasteImport";
import { MAX_IMPORT_BYTES } from "../core/importPayload";

export function ImportRecordDialog({ onClose }: { onClose: () => void }) {
  const ref = useModalShell({ open: true, onClose });
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const request = useRef(0);
  const toast = useToast();
  React.useEffect(
    () => () => {
      request.current++;
    },
    []
  );
  const readFile = async (file: File) => {
    const token = ++request.current;
    if (file.size > MAX_IMPORT_BYTES) {
      setReading(false);
      setError("Choose a record smaller than 1 MB.");
      return;
    }
    setReading(true);
    try {
      const value = await file.text();
      if (request.current === token) {
        setText(value);
        setError("");
      }
    } catch {
      if (request.current === token) setError("The file could not be read. Try another file.");
    } finally {
      if (request.current === token) setReading(false);
    }
  };
  const apply = () => {
    const result = parsePastedPayload(text);
    if (!result.data) {
      setError(result.summary);
      return;
    }
    useFormStore
      .getState()
      .loadJson(
        { ...result.data, ...(result.subfileType ? { subfileType: result.subfileType } : {}) },
        result.kind === "aamva" ? text : undefined
      );
    toast.success(`${result.summary} Undo is available in the toolbar.`);
    onClose();
  };
  return (
    <div className="modal-backdrop">
      <div
        ref={ref}
        className="wb-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">Bring a record into the workspace</span>
            <h2 id="import-title">Import payload or JSON</h2>
          </div>
          <button className="wb-button" onClick={onClose} aria-label="Close import">
            Close
          </button>
        </div>
        <p>
          Paste an AAMVA payload or a saved JSON record. Import replaces the current record in one
          undoable step. Processing stays in this browser.
        </p>
        <label className="wb-label" htmlFor="import-text">
          Source data
        </label>
        <textarea
          data-autofocus
          id="import-text"
          className="import-text"
          value={text}
          onPaste={(e) => {
            e.preventDefault();
            e.stopPropagation();
            request.current++;
            setReading(false);
            setText(e.clipboardData.getData("text/plain"));
            setError("");
          }}
          onChange={(e) => {
            request.current++;
            setReading(false);
            setText(e.target.value);
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "import-error" : undefined}
          spellCheck={false}
          autoComplete="off"
        />
        {error && (
          <p className="field-error" id="import-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <label className="file-picker wb-button">
            Choose JSON or text file
            <input
              type="file"
              accept=".json,.txt,application/json,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void readFile(file);
              }}
            />
          </label>
          <button className="wb-button primary" disabled={!text.trim() || reading} onClick={apply}>
            {reading ? "Reading…" : "Import record"}
          </button>
        </div>
      </div>
    </div>
  );
}
