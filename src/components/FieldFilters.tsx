import React from "react";
import { Search, X as XIcon, ArrowDown } from "lucide-react";

interface FieldFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  requiredOnly: boolean;
  onRequiredOnlyChange: (value: boolean) => void;
  matchCount: number;
  totalCount: number;
  requiredFilled: number;
  requiredTotal: number;
  onJumpToNextEmpty: () => void;
  hasNextEmpty: boolean;
}

export const FieldFilters: React.FC<FieldFiltersProps> = ({
  query,
  onQueryChange,
  requiredOnly,
  onRequiredOnlyChange,
  matchCount,
  totalCount,
  requiredFilled,
  requiredTotal,
  onJumpToNextEmpty,
  hasNextEmpty
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

  const requiredPct =
    requiredTotal === 0 ? 100 : Math.round((requiredFilled / requiredTotal) * 100);
  const requiredColor =
    requiredPct === 100 ? "bg-green-500" : requiredPct >= 50 ? "bg-brand-500" : "bg-amber-500";
  const filtered = query.trim().length > 0 || requiredOnly;

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-[#1E1E1E] border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search fields by code or label (Ctrl+K)"
            aria-label="Search fields"
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none px-2 py-1 rounded-md bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444]">
          <input
            type="checkbox"
            checked={requiredOnly}
            onChange={(e) => onRequiredOnlyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-[#555] dark:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Show only required fields"
          />
          Required only
        </label>

        <button
          type="button"
          onClick={onJumpToNextEmpty}
          disabled={!hasNextEmpty}
          aria-label="Jump to next empty required field"
          title={
            hasNextEmpty ? "Jump to next empty required field" : "All required fields are filled"
          }
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#444] text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowDown size={12} aria-hidden="true" />
          Next empty required
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
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
      </div>
    </div>
  );
};
