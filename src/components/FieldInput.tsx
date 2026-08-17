import React from "react";
import { Copy, Check, X as XIcon, HelpCircle, Wand2 } from "lucide-react";
import type { AAMVAField } from "../core/schema";
import { AAMVA_FIELD_LIMITS } from "../core/schema";
import { evaluateFieldValue } from "../core/validation";
import { getCanonicalRewrite, getQuickFix } from "../core/quickFix";
import {
  describeAamvaDate,
  getDateChips,
  normalizeDateInput,
  yearsBetween,
  type AamvaDateFormat
} from "../core/dateHelpers";
import { getFieldHelp } from "../core/fieldHelp";
import { HeightSilhouette } from "./HeightSilhouette";

/**
 * Field types the encoder uppercases on the way out (see generateAAMVAPayload).
 * Typing into one of these is upper-cased live so the form shows the bytes that
 * will actually be in the barcode, rather than a friendlier fiction.
 */
const UPPERCASED_TYPES = new Set<AAMVAField["type"]>(["string", "char", "zip"]);

/**
 * Pulls the allowed values out of an enumeration message so they can be offered
 * as one-click chips instead of being truncated into illegibility. Mirrors the
 * message `evaluateFieldValue` builds for `getAllowedSet` failures.
 */
function parseAllowedValues(message: string | undefined): string[] {
  if (!message) return [];
  const match = /^Value must be one of:\s*(.+?)\.?$/.exec(message);
  if (!match?.[1]) return [];
  return match[1]
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface FieldInputProps {
  field: AAMVAField;
  value: string;
  state: string;
  strictMode: boolean;
  copied: boolean;
  whimsy?: boolean;
  /**
   * Sibling values the date affordances need — an expiry chip is "+8 years from
   * the issue date", which needs the issue date.
   */
  allValues?: Record<string, string>;
  /** Term to highlight in the label, from the field search box. */
  highlight?: string;
  /**
   * The app fills this field and the encoder overrides anything else, so it is
   * shown but not editable. The string is the reason, rendered under the input.
   */
  derivedFrom?: string;
  onChange: (code: string, value: string) => void;
  onCopy: (code: string, value: string) => void;
  onReset: (code: string) => void;
  onGenerate: (code: string) => void;
  onDisableStrict?: () => void;
  onHelpOpened?: (code: string) => void;
}

/** Wraps occurrences of `term` in the label so search matches are visible. */
function Highlighted({ text, term }: { text: string; term: string }) {
  const needle = term.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-hit">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export const FieldInput: React.FC<FieldInputProps> = ({
  field,
  value,
  state,
  strictMode,
  copied,
  whimsy = false,
  allValues,
  highlight = "",
  derivedFrom,
  onChange,
  onCopy,
  onReset,
  onGenerate,
  onDisableStrict,
  onHelpOpened
}) => {
  const evalResult = evaluateFieldValue(field, value, state, strictMode);
  // A pristine empty form should not open covered in red, so an empty required
  // field only reports once the user has been in it. Without the touched gate
  // the "Required field is empty." result was unreachable in the UI even though
  // the validation panel counted it as a blocking error.
  const [touched, setTouched] = React.useState(false);
  const isWarning = !!value && evalResult.severity === "warning";
  const hasError = (!!value || touched) && !evalResult.ok && !isWarning;
  const showAdvisory = hasError || isWarning;
  const errorId = `error-${field.code}`;
  const helpId = `help-${field.code}`;
  const helpText = getFieldHelp(field.code);
  const [helpOpen, setHelpOpen] = React.useState(false);
  // Any field the user can type into is clearable; DAJ is app-owned and read-only.
  const isResettable = !derivedFrom;
  const allowedValues = hasError ? parseAllowedValues(evalResult.message) : [];
  const maxLen = AAMVA_FIELD_LIMITS[field.code];

  const dateFormat: AamvaDateFormat = field.dateFormat === "YYYYMMDD" ? "YYYYMMDD" : "MMDDYYYY";
  const isDate = field.type === "date";

  // Typing into a field the encoder uppercases anyway is upper-cased live.
  // Casing never changes the string's length, so the caret stays put.
  const handleChange = (raw: string) => {
    onChange(field.code, UPPERCASED_TYPES.has(field.type) ? raw.toUpperCase() : raw);
  };

  // Dates are normalised when the user leaves the field rather than as they
  // type — rewriting "8/1" to a full date mid-keystroke fights the typist.
  const handleDateBlur = () => {
    if (!isDate || !value.trim()) return;
    const normalized = normalizeDateInput(value, dateFormat);
    if (normalized && normalized !== value) onChange(field.code, normalized);
  };

  const dateReadout = React.useMemo(() => {
    if (!isDate) return "";
    const described = describeAamvaDate(value, dateFormat);
    if (!described) return "";
    // The one derived number worth showing: how old the holder is on this date.
    if (field.code === "DBB") {
      const age = yearsBetween(value, allValues?.DBD || "", dateFormat);
      return age !== null && age >= 0 ? `${described} · age ${age} at issue` : described;
    }
    return described;
  }, [isDate, value, dateFormat, field.code, allValues?.DBD]);

  const dateChips = React.useMemo(
    () =>
      isDate && !value.trim()
        ? getDateChips(field.code, allValues ?? {}, { format: dateFormat, stateCode: state })
        : [],
    [isDate, value, field.code, allValues, dateFormat, state]
  );

  // A repair for a value that fails, or the encoder-canonical form of one that
  // passes. Both are a single click; neither ever invents a value.
  const quickFix = React.useMemo(
    () =>
      getQuickFix(field, value, state, strictMode) ??
      getCanonicalRewrite(field, value, state, strictMode),
    [field, value, state, strictMode]
  );

  // The counter is deliberately NOT a live region: it changes on every
  // keystroke, so announcing it drowns out the field's own feedback. Announce
  // only when the length actually starts to matter.
  const counterMilestone = React.useMemo(() => {
    if (!maxLen) return "";
    if (value.length >= maxLen) return `${field.code} is at its ${maxLen} character limit.`;
    if (value.length >= Math.floor(maxLen * 0.8)) {
      return `${maxLen - value.length} characters left in ${field.code}.`;
    }
    return "";
  }, [value.length, maxLen, field.code]);

  // The popover used to close only on the help button's own `blur`. A click on
  // a <button> does not move focus in Safari or Firefox, so the blur never
  // arrived and the box stayed open — one per field, stacking over the form
  // until the page was reloaded. Dismissal now runs off the events that
  // actually happen: a pointer press anywhere outside, Escape, or a scroll that
  // carries the popover away from the field it describes.
  const helpRef = React.useRef<HTMLDivElement>(null);
  const helpButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!helpOpen) return;

    const onPointerDown = (e: PointerEvent | MouseEvent) => {
      if (!helpRef.current?.contains(e.target as Node)) setHelpOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setHelpOpen(false);
      helpButtonRef.current?.focus();
    };
    // Capture phase: a scroll inside the form column does not bubble to window.
    const onScroll = () => setHelpOpen(false);

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [helpOpen]);

  const helpButton = helpText ? (
    <button
      ref={helpButtonRef}
      type="button"
      onClick={() => {
        setHelpOpen((v) => {
          if (!v) onHelpOpened?.(field.code);
          return !v;
        });
      }}
      aria-expanded={helpOpen}
      aria-controls={helpId}
      aria-label={`${helpOpen ? "Hide" : "Show"} help for ${field.code}`}
      title={`What is ${field.code}?`}
      className={`absolute top-1 right-7 z-30 p-1 rounded hover:text-brand-600 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        helpOpen ? "text-brand-600 dark:text-brand-300" : "text-gray-600 dark:text-gray-300"
      }`}
    >
      <HelpCircle size={12} />
    </button>
  ) : null;

  const baseInputClass =
    "block w-full px-3 pt-5 pb-2 text-sm text-gray-900 bg-gray-100 dark:bg-[#2C2C2C] border-0 border-b-2 appearance-none dark:text-gray-100 focus:outline-none focus:ring-0 peer transition-all duration-200 ease-in-out rounded-t-md pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500";
  const normalClass = `${baseInputClass} border-gray-300 dark:border-[#555] focus:border-brand-500`;
  const errorClass = `${baseInputClass} border-red-500 focus:border-red-500`;
  const warningClass = `${baseInputClass} border-amber-500 focus:border-amber-500`;
  const finalClass = hasError ? errorClass : isWarning ? warningClass : normalClass;

  // The floated label renders at scale-75 of text-sm — about 10.5px. At that
  // size gray-500 on the near-white themed input fill was only just over the
  // 4.5:1 floor, which is why the field names read as washed out; gray-600 /
  // gray-300 clears 7:1 in both themes.
  const labelClass = `absolute text-sm duration-300 transform top-4 z-10 origin-[0] left-3 pointer-events-none ${
    hasError
      ? "text-red-600 dark:text-red-400"
      : isWarning
        ? "text-amber-700 dark:text-amber-300"
        : "text-gray-600 dark:text-gray-300 peer-focus:text-brand-600 peer-focus:dark:text-brand-300"
  } truncate w-[85%]`;

  const copyIcon = value ? (
    <button
      type="button"
      onClick={() => onCopy(field.code, value)}
      aria-label={copied ? "Copied" : `Copy ${field.code} value`}
      title={copied ? "Copied!" : `Copy ${field.code}`}
      className="field-hover-action absolute -top-1 right-1 z-30 p-1 rounded text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  ) : null;

  return (
    <div className="flex flex-col relative group">
      {copyIcon}
      {helpText && (
        // Button and popover share a wrapper so the outside-press check has a
        // single subtree to test against. The wrapper is unpositioned, so both
        // children still resolve their `absolute` offsets against the field.
        <div ref={helpRef}>
          {helpButton}
          {helpOpen && (
            <div
              id={helpId}
              role="tooltip"
              className="absolute z-40 top-full left-0 right-0 mt-1 px-3 py-2 pr-7 text-xs leading-snug rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-100 shadow-lg"
            >
              {helpText}
              <button
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  helpButtonRef.current?.focus();
                }}
                aria-label={`Close help for ${field.code}`}
                className="absolute top-1 right-1 p-1 rounded text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <XIcon size={11} aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
      {field.options ? (
        <div className="relative">
          <select
            id={field.code}
            value={value}
            onChange={(e) => onChange(field.code, e.target.value)}
            onBlur={() => setTouched(true)}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            // An empty select used to render its own text transparent, so the
            // control was a blank box with no hint that it holds a list at all.
            // The placeholder is muted rather than invisible.
            className={finalClass + (value ? "" : " text-gray-600 dark:text-gray-300")}
          >
            <option value="" disabled className="text-gray-600 dark:text-gray-300">
              Select…
            </option>
            {field.options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-surface"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <label
            htmlFor={field.code}
            className={labelClass.replace(
              "transform top-4",
              "transform -translate-y-3 scale-75 top-4"
            )}
          >
            <Highlighted text={field.code} term={highlight} /> —{" "}
            <Highlighted text={field.label} term={highlight} />{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
        </div>
      ) : field.type === "date" ? (
        <div className="relative flex">
          <input
            type="text"
            id={field.code}
            value={value}
            placeholder={field.dateFormat || " "}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => {
              setTouched(true);
              handleDateBlur();
            }}
            // Roomy enough to type the separators people actually use
            // ("08/11/2026"); the blur handler folds it back to eight digits.
            maxLength={10}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            className={`${finalClass} float-label-input`}
          />
          <label
            htmlFor={field.code}
            className={labelClass.replace(
              "transform top-4",
              "transform -translate-y-3 scale-75 top-4"
            )}
          >
            <Highlighted text={field.code} term={highlight} /> —{" "}
            <Highlighted text={field.label} term={highlight} />{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="absolute right-1.5 top-2 bottom-2 flex gap-1 z-20">
            {field.code === "DDB" && (
              <button
                type="button"
                onClick={() => onGenerate(field.code)}
                className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Generate Card Revision Date"
                aria-label="Generate Card Revision Date"
              >
                Gen
              </button>
            )}
            {isResettable && value && (
              <button
                type="button"
                onClick={() => onReset(field.code)}
                aria-label={`Reset ${field.code}`}
                title={`Reset ${field.code}`}
                className="flex items-center justify-center w-5 bg-gray-200 hover:bg-red-100 dark:bg-[#444] dark:hover:bg-red-900/40 rounded text-gray-700 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-400 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <XIcon size={11} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex">
          <input
            type="text"
            id={field.code}
            value={value}
            placeholder={field.dateFormat || " "}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={AAMVA_FIELD_LIMITS[field.code]}
            readOnly={!!derivedFrom}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            title={derivedFrom}
            className={`${finalClass} float-label-input${derivedFrom ? " cursor-not-allowed opacity-80" : ""}`}
          />
          <label
            htmlFor={field.code}
            className={labelClass.replace(
              "transform top-4",
              "transform -translate-y-3 scale-75 top-4"
            )}
          >
            <Highlighted text={field.code} term={highlight} /> —{" "}
            <Highlighted text={field.label} term={highlight} />{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="absolute right-1.5 top-2 bottom-2 flex gap-1 z-20">
            {(field.code === "DCF" || field.code === "DAQ") && (
              <button
                type="button"
                onClick={() => onGenerate(field.code)}
                className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title={`Generate ${field.label}`}
                aria-label={`Generate ${field.label}`}
              >
                Gen
              </button>
            )}
            {(field.code === "DCB" || field.code === "DCD") && (
              <button
                type="button"
                onClick={() => onChange(field.code, "NONE")}
                className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title={`Set ${field.label} to NONE`}
                aria-label={`Set ${field.label} to NONE`}
              >
                None
              </button>
            )}
            {isResettable && value && (
              <button
                type="button"
                onClick={() => onReset(field.code)}
                aria-label={`Reset ${field.code}`}
                title={`Reset ${field.code}`}
                className="flex items-center justify-center w-5 bg-gray-200 hover:bg-red-100 dark:bg-[#444] dark:hover:bg-red-900/40 rounded text-gray-700 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-400 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <XIcon size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="absolute -bottom-4 left-0 right-0 flex justify-between items-start pointer-events-none transition-opacity duration-200">
        <div className="flex-1 min-w-0">
          {showAdvisory && (
            <span
              id={errorId}
              role={hasError ? "alert" : "status"}
              data-severity={hasError ? "error" : "warning"}
              // Two lines plus a title: enumeration messages ("Value must be one
              // of: BLK, BLU, BRO, GRY, GRN, HAZ, MAR, PNK, DIC, UNK.") used to
              // be clipped to about six useful characters with no way to read
              // the rest.
              title={evalResult.message}
              className={`block text-xs font-medium field-advisory pointer-events-auto ${
                hasError ? "text-red-500" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {allowedValues.length > 0
                ? "Value must be one of:"
                : evalResult.message ||
                  (hasError
                    ? `Invalid format${field.dateFormat ? ` (e.g. ${field.dateFormat})` : ""}`
                    : "Advisory")}
              {hasError && strictMode && onDisableStrict && allowedValues.length === 0 && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={onDisableStrict}
                    className="underline font-semibold hover:text-red-700 dark:hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                  >
                    Disable strict
                  </button>
                </>
              )}
            </span>
          )}
          {/* One deterministic repair, applied in a click. Never shown unless
              the rewritten value is one the validator accepts. */}
          {quickFix && (
            <button
              type="button"
              onClick={() => onChange(field.code, quickFix.value)}
              title={quickFix.description}
              aria-label={`${quickFix.description} for ${field.code}`}
              className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold pointer-events-auto transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                showAdvisory
                  ? "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60"
                  : "border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-dark-surface2 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              <Wand2 size={10} aria-hidden />
              {quickFix.label}
              <span className="font-mono">{quickFix.value}</span>
            </button>
          )}
          {/* What the eight digits actually mean, so a transposed year is
              visible before it reaches the barcode. */}
          {dateReadout && !showAdvisory && (
            <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {dateReadout}
            </span>
          )}
          {derivedFrom && (
            <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {derivedFrom}
            </span>
          )}
          {dateChips.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1 pointer-events-auto">
              {dateChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => onChange(field.code, chip.value)}
                  title={chip.title}
                  aria-label={`Set ${field.code}: ${chip.title}`}
                  className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-dark-surface2 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#383838] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
          {/* Enumerated values become one-click chips — reading the list and
              fixing the field are the same gesture. */}
          {allowedValues.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1 pointer-events-auto">
              {allowedValues.map((allowed) => (
                <button
                  key={allowed}
                  type="button"
                  onClick={() => onChange(field.code, allowed)}
                  title={`Set ${field.code} to ${allowed}`}
                  className="px-1.5 py-0.5 rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-[10px] font-mono font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {allowed}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {whimsy && field.code === "DAU" && <HeightSilhouette value={value} />}
          {!field.options && maxLen && (
            <span
              className="text-xs font-medium text-gray-600 dark:text-gray-300 opacity-0 group-focus-within:opacity-100 transition-opacity whitespace-nowrap"
              aria-hidden
              title={`${value.length} of ${maxLen} characters used`}
            >
              {value.length}/{maxLen}
            </span>
          )}
        </div>
      </div>
      {/* The only part of the counter worth announcing. */}
      {counterMilestone && (
        <span className="sr-only" role="status" aria-live="polite">
          {counterMilestone}
        </span>
      )}
    </div>
  );
};
