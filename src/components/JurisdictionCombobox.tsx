import React from "react";
import { Check, ChevronsUpDown, Search, X as XIcon } from "lucide-react";
import { AAMVA_STATES, isJurisdictionSupported } from "../core/states";

interface JurisdictionComboboxProps {
  value: string;
  onChange: (code: string) => void;
  recent: string[];
  id?: string;
}

interface Option {
  code: string;
  name: string;
  supported: boolean;
}

interface OptionGroup {
  label: string;
  options: Option[];
}

// The four non-state jurisdictions in the registry. DC files with the states —
// it issues a standard credential — while the island territories are grouped
// separately, which is how people look for them.
const TERRITORY_CODES = new Set(["AS", "GU", "VI", "PR", "MP"]);

const ALL_OPTIONS: Option[] = Object.entries(AAMVA_STATES)
  .map(([code, meta]) => ({
    code,
    name: meta.name,
    supported: isJurisdictionSupported(code)
  }))
  // Sorted by NAME, not by code. The old native <select> sorted by
  // abbreviation, which produced "AK, AL, AR, AS, AZ…" — an ordering nobody
  // scans in, and one where native type-ahead matched the code rather than the
  // name people were typing.
  .sort((a, b) => a.name.localeCompare(b.name));

function matches(option: Option, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return option.name.toLowerCase().includes(q) || option.code.toLowerCase().includes(q);
}

/**
 * A type-to-filter jurisdiction picker with a "Recent" group.
 *
 * Implemented as an ARIA 1.2 combobox with an owned listbox rather than a
 * native <select> so it can filter on name *and* code, group recents, and keep
 * territories visually separate.
 */
export const JurisdictionCombobox: React.FC<JurisdictionComboboxProps> = ({
  value,
  onChange,
  recent,
  id = "state-select"
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const selected = AAMVA_STATES[value];
  const listboxId = `${id}-listbox`;

  const groups: OptionGroup[] = React.useMemo(() => {
    const filtered = ALL_OPTIONS.filter((o) => matches(o, query));
    const recentOptions = recent
      .map((code) => filtered.find((o) => o.code === code))
      .filter((o): o is Option => !!o);
    const recentCodes = new Set(recentOptions.map((o) => o.code));
    const rest = filtered.filter((o) => !recentCodes.has(o.code));

    const out: OptionGroup[] = [];
    if (recentOptions.length > 0) out.push({ label: "Recent", options: recentOptions });
    const states = rest.filter((o) => !TERRITORY_CODES.has(o.code));
    const territories = rest.filter((o) => TERRITORY_CODES.has(o.code));
    if (states.length > 0) out.push({ label: "States & District", options: states });
    if (territories.length > 0) out.push({ label: "Territories", options: territories });
    return out;
  }, [query, recent]);

  // Flattened view drives keyboard navigation across group boundaries.
  const flat = React.useMemo(() => groups.flatMap((g) => g.options), [groups]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Keep the highlighted row in view as the user arrows through the list.
  React.useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // The active row can outlive the list it indexed into (the query narrowed the
  // results). Clamp at render rather than resetting from an effect.
  const safeActiveIndex = flat.length === 0 ? 0 : Math.min(activeIndex, flat.length - 1);

  const commit = (option: Option | undefined) => {
    if (!option || !option.supported) return;
    onChange(option.code);
    close();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(() => {
        if (flat.length === 0) return 0;
        return (safeActiveIndex + delta + flat.length) % flat.length;
      });
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        commit(flat[safeActiveIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActiveIndex(Math.max(0, flat.length - 1));
    }
  };

  let renderIndex = -1;

  return (
    <div className="relative" ref={rootRef}>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && flat[safeActiveIndex] ? `${id}-opt-${flat[safeActiveIndex]!.code}` : undefined
          }
          aria-label="Select state or territory"
          value={open ? query : selected ? `${selected.name} (${value})` : value}
          placeholder="Type a state name or code"
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full border-gray-300 dark:border-[#555] dark:bg-dark-surface2 dark:text-gray-100 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm p-2.5 pr-16 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
        {open && (
          <Search
            size={14}
            aria-hidden
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
        {open && query && (
          <button
            type="button"
            aria-label="Clear jurisdiction search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <XIcon size={14} />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => {
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ChevronsUpDown size={14} />
        </button>
      </div>

      {open && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Jurisdictions"
          className="absolute z-40 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-lg py-1"
        >
          {flat.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No jurisdiction matches “{query}”.
            </li>
          )}
          {groups.map((group) => (
            <li key={group.label} role="presentation">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </div>
              <ul role="presentation">
                {group.options.map((option) => {
                  renderIndex += 1;
                  const index = renderIndex;
                  const isActive = index === safeActiveIndex;
                  const isSelected = option.code === value;
                  return (
                    <li
                      key={`${group.label}-${option.code}`}
                      id={`${id}-opt-${option.code}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={!option.supported}
                      data-active={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(option)}
                      className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer ${
                        isActive ? "bg-brand-50 dark:bg-brand-900/30" : ""
                      } ${
                        option.supported
                          ? "text-gray-800 dark:text-gray-100"
                          : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <span className="truncate">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-2">
                          {option.code}
                        </span>
                        {/* An explicit space: the margin separates the two
                            visually, but without a text node the accessible
                            name runs together as "CACalifornia". */}{" "}
                        {option.name}
                        {!option.supported && " (unsupported)"}
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-brand-600 dark:text-brand-400 shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
