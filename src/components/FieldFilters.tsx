import React from "react";
import { formatShortcut } from "../core/modKey";
interface FieldFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  requiredOnly: boolean;
  onRequiredOnlyChange: (value: boolean) => void;
  issuesOnly: boolean;
  onIssuesOnlyChange: (value: boolean) => void;
  issueCount: number;
  matchCount: number;
  totalCount: number;
  requiredFilled: number;
  requiredTotal: number;
  onJumpToNextEmpty: () => void;
  hasNextEmpty: boolean;
  onGenerateAutoFields: () => void;
  onFillSample?: () => void;
  children?: React.ReactNode;
}
export const FieldFilters: React.FC<FieldFiltersProps> = (p) => {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        !document.querySelector('[role="dialog"][aria-modal="true"]')
      ) {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="field-filters">
      <div className="filter-search">
        <input
          ref={ref}
          type="search"
          value={p.query}
          onChange={(e) => p.onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              p.onQueryChange("");
              p.onRequiredOnlyChange(false);
              p.onIssuesOnlyChange(false);
            }
          }}
          placeholder={`Find a field or code · ${formatShortcut(["mod", "K"])}`}
          aria-label="Search fields"
        />
        {p.query && (
          <button
            className="wb-button"
            onClick={() => p.onQueryChange("")}
            aria-label="Clear field search"
            title="Clear field search"
          >
            Clear
          </button>
        )}
      </div>
      <div className="filter-controls">
        <label>
          <input
            type="checkbox"
            checked={p.requiredOnly}
            onChange={(e) => p.onRequiredOnlyChange(e.target.checked)}
            aria-label="Show only required fields"
          />
          Required only
        </label>
        <label>
          <input
            type="checkbox"
            checked={p.issuesOnly}
            disabled={!p.issueCount && !p.issuesOnly}
            onChange={(e) => p.onIssuesOnlyChange(e.target.checked)}
            aria-label="Show only fields with validation issues"
          />
          Problems{p.issueCount ? ` (${p.issueCount})` : ""}
        </label>
        <span className="completion-count">
          {p.requiredFilled}/{p.requiredTotal} required
        </span>
        <button
          className="text-button"
          disabled={!p.hasNextEmpty}
          onClick={p.onJumpToNextEmpty}
          aria-label="Jump to next empty required field"
        >
          Next empty →
        </button>
        <details className="field-tools">
          <summary>Fill tools</summary>
          <div className="tool-popover">
            <button
              onClick={p.onGenerateAutoFields}
              aria-label="Generate auto fields (DCF, DAQ, DDB)"
            >
              Generate identifiers
            </button>
            {p.onFillSample && (
              <button onClick={p.onFillSample} aria-label="Fill all fields with demo data">
                Fill synthetic sample
              </button>
            )}
          </div>
        </details>
      </div>
      {(p.query || p.requiredOnly || p.issuesOnly) && (
        <p role="status" className="filter-result">
          {p.matchCount} of {p.totalCount} fields match
        </p>
      )}
      {p.children}
    </div>
  );
};
