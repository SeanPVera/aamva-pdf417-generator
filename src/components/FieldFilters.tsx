import React from "react";
import { Search, X as XIcon, ArrowDown, Wand2, FlaskConical, AlertCircle } from "lucide-react";
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
  /** Rendered under the counters — the group navigator strip. */
  children?: React.ReactNode;
}

export const FieldFilters: React.FC<FieldFiltersProps> = ({
  query,
  onQueryChange,
  requiredOnly,
  onRequiredOnlyChange,
  issuesOnly,
  onIssuesOnlyChange,
  issueCount,
  matchCount,
  totalCount,
  requiredFilled,
  requiredTotal,
  onJumpToNextEmpty,
  hasNextEmpty,
  onGenerateAutoFields,
  onFillSample,
  children
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Ctrl/Cmd+K focuses the search box.
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Escape inside the search box clears the whole filter set, not just the
  // query — the way out of "no fields found" should be one key, and Safari
  // does not fire the native search-input clear event.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (query) onQueryChange("");
    else if (requiredOnly || issuesOnly) {
      onRequiredOnlyChange(false);
      onIssuesOnlyChange(false);
    } else {
      inputRef.current?.blur();
    }
  };

  const requiredPct =
    requiredTotal === 0 ? 100 : Math.round((requiredFilled / requiredTotal) * 100);
  const requiredColor =
    requiredPct === 100 ? "bg-green-500" : requiredPct >= 50 ? "bg-brand-500" : "bg-amber-500";
  const filtered = query.trim().length > 0 || requiredOnly || issuesOnly;

  return (
    <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-[#1E1E1E] lg:px-6 lg:py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={`Search fields (${formatShortcut(["mod", "K"])})`}
            aria-label="Search fields"
            aria-describedby="field-search-hint"
            className="h-k-touch w-full rounded-k border border-gray-300 bg-gray-100 pl-9 pr-10 text-k-label text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-[#4A4A4A] dark:bg-[#2C2C2C] dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-0 top-1/2 inline-flex h-k-touch w-k-touch -translate-y-1/2 items-center justify-center rounded-k text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        {onFillSample && (
          <button
            type="button"
            onClick={onFillSample}
            aria-label="Fill all fields with demo data"
            title="Fill all fields with realistic demo data"
            className="inline-flex h-k-touch items-center gap-1.5 rounded-k bg-brand-700 px-3 text-k-help font-bold text-white hover:bg-brand-800 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <FlaskConical size={16} aria-hidden="true" />
            Fill
          </button>
        )}

        <div className="hidden lg:contents">

        <label className="inline-flex h-k-touch items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none px-3 rounded-k bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500">
          <input
            type="checkbox"
            checked={requiredOnly}
            onChange={(e) => onRequiredOnlyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-[#555] dark:bg-dark-surface2 focus-visible:outline-none"
            aria-label="Show only required fields"
          />
          Required only
        </label>

        {/* Issues-only: with errors scattered across collapsed groups, the old
            workflow was jump → fix → scroll back → jump again. */}
        <label
          className={`inline-flex h-k-touch items-center gap-1.5 text-xs font-medium cursor-pointer select-none px-3 rounded-k border has-[:focus-visible]:ring-2 ${
            issueCount > 0
              ? "bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 has-[:focus-visible]:ring-red-500"
              : "bg-gray-100 dark:bg-[#2C2C2C] border-gray-200 dark:border-[#444] text-gray-500 dark:text-gray-400 cursor-not-allowed has-[:focus-visible]:ring-brand-500"
          }`}
          title={
            issueCount > 0
              ? "Show only fields with a validation issue (F8 steps through them)"
              : "No validation issues to filter"
          }
        >
          <input
            type="checkbox"
            checked={issuesOnly}
            disabled={issueCount === 0}
            onChange={(e) => onIssuesOnlyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500 border-gray-300 dark:border-[#555] dark:bg-dark-surface2 focus-visible:outline-none"
            aria-label="Show only fields with validation issues"
          />
          <AlertCircle size={12} aria-hidden="true" />
          Problems only{issueCount > 0 ? ` (${issueCount})` : ""}
        </label>

        <button
          type="button"
          onClick={onJumpToNextEmpty}
          disabled={!hasNextEmpty}
          aria-label="Jump to next empty required field"
          title={
            hasNextEmpty ? "Jump to next empty required field" : "All required fields are filled"
          }
          className="inline-flex h-k-touch items-center gap-1 px-3 rounded-k bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444] text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowDown size={12} aria-hidden="true" />
          Next empty required
        </button>

        <button
          type="button"
          onClick={onGenerateAutoFields}
          aria-label="Generate auto fields (DCF, DAQ, DDB)"
          title={`Generate auto fields (${formatShortcut(["mod", "G"])})`}
          className="inline-flex h-k-touch items-center gap-1 px-3 rounded-k bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444] text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Wand2 size={12} aria-hidden="true" />
          Generate auto fields
        </button>

        {onFillSample && (
          <button
            type="button"
            onClick={onFillSample}
            aria-label="Fill all fields with demo data"
            title="Fill all fields with realistic demo data"
            className="inline-flex h-k-touch items-center gap-1 px-3 rounded-k bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <FlaskConical size={12} aria-hidden="true" />
            Autofill demo
          </button>
        )}
        </div>
      </div>

      <div className="hidden lg:flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {requiredFilled}/{requiredTotal} required
          </span>
          <div
            className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-dark-surface2 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={requiredTotal}
            aria-valuenow={requiredFilled}
            aria-label="Required fields completion"
          >
            <div
              className={`h-full transition-all duration-300 ease-out ${requiredColor}`}
              style={{ width: `${requiredPct}%` }}
            />
          </div>
        </div>
        <span aria-live="polite" className="text-gray-500 dark:text-gray-400">
          {filtered ? `${matchCount} of ${totalCount} fields shown` : `${totalCount} fields`}
        </span>
        {filtered && (
          <span id="field-search-hint" className="text-gray-500 dark:text-gray-400">
            Esc clears
          </span>
        )}
      </div>
      {children}
    </div>
  );
};
