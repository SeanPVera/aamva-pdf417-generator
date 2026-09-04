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

  // Help and copy sit on the label row now. Under the floating label they were
  // absolutely positioned over the input, which put two ~24px targets on top of
  // the text the user was typing; at 56px controls that overlap is worse, not
  // better.
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
      className={`inline-flex h-k-touch w-k-touch items-center justify-center rounded-k transition-colors hover:bg-gray-100 dark:hover:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        helpOpen ? "text-brand-600 dark:text-brand-300" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <HelpCircle size={17} aria-hidden />
    </button>
  ) : null;

  const copyButton = value ? (
    <button
      type="button"
      onClick={() => onCopy(field.code, value)}
      aria-label={copied ? "Copied" : `Copy ${field.code} value`}
      title={copied ? "Copied!" : `Copy ${field.code}`}
      className="field-hover-action inline-flex h-k-touch w-k-touch items-center justify-center rounded-k text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-dark-surface2 dark:hover:text-brand-400"
    >
      {copied ? (
        <Check size={17} className="text-green-600 dark:text-green-400" aria-hidden />
      ) : (
        <Copy size={17} aria-hidden />
      )}
    </button>
  ) : null;

  // A trailing action needs room inside the control, and only some fields have
  // one — reserving the gutter unconditionally left every other field with a
  // ragged-looking right margin.
  const generatesOwnValue = field.code === "DDB" || field.code === "DCF" || field.code === "DAQ";
  const offersNone = field.code === "DCB" || field.code === "DCD";
  const trailingActions =
    (generatesOwnValue ? 1 : 0) + (offersNone ? 1 : 0) + (isResettable && value ? 1 : 0);
  const trailingPad =
    trailingActions >= 2 ? "pr-[8.5rem]" : trailingActions === 1 ? "pr-[5.25rem]" : "pr-4";

  // 56px tall, 18px value. An empty optional field is dashed rather than solid
  // so what may be skipped is legible without reading a legend — the required
  // marker alone made "required" the thing you had to hunt for.
  const isEmpty = !value.trim();
  const baseInputClass = `block w-full h-k-control rounded-k pl-4 ${trailingPad} text-k-value text-gray-900 dark:text-gray-100 bg-white dark:bg-[#2C2C2C] border-[1.5px] appearance-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`;
  // WCAG 1.4.11 wants 3:1 between a control's boundary and BOTH the colours it
  // sits between. The jurisdiction theme paints the fill with `!important` (a
  // deliberate rule — borders carry validation state, so only the fill is
  // themed), and gray-300 against that fill measured 1.3:1, gray-300 against
  // the white panel 1.47:1. Neither is a boundary; it is a suggestion of one.
  // gray-500 clears it at 4.25:1 and 4.83:1. Dark needed a second pass: the
  // themed dark fill is a color-mix, and #6E6E6E only reached 2.70:1 against
  // it; #7A7A7A gets 3.20:1 against the fill and 3.96:1 against the surface.
  const restingBorder =
    !field.required && isEmpty
      ? "border-dashed border-gray-500 dark:border-[#7A7A7A]"
      : "border-gray-500 dark:border-[#7A7A7A]";
  const finalClass = hasError
    ? `${baseInputClass} border-red-500 focus:border-red-500`
    : isWarning
      ? `${baseInputClass} border-amber-500 focus:border-amber-500`
      : `${baseInputClass} ${restingBorder} focus:border-brand-500`;

  // The trailing buttons clear the 44px floor. Under the old 40px control they
  // were 20px wide, which is a target you aim at rather than press.
  const trailingButtonClass =
    "inline-flex h-k-touch items-center justify-center rounded-[0.5rem] px-3 text-k-help font-semibold text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-[#3A3A3A] dark:text-gray-100 dark:hover:bg-[#484848] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

  const labelRow = (
    <div className="flex items-center justify-between gap-2">
      {/* No truncation and no width cap. The floated label was clamped to 85%
          of a 230px column, which is why "DDE — Family Name Trun…" was the
          whole name a user ever saw. */}
      <label
        htmlFor={field.code}
        className={`text-k-label font-semibold leading-snug ${
          hasError
            ? "text-red-700 dark:text-red-300"
            : isWarning
              ? "text-amber-800 dark:text-amber-300"
              : "text-gray-800 dark:text-gray-100"
        }`}
      >
        <span className="font-mono text-k-help font-medium text-gray-500 dark:text-gray-400">
          <Highlighted text={field.code} term={highlight} />
        </span>{" "}
        <Highlighted text={field.label} term={highlight} />
        {field.required ? (
          <span className="text-red-600 dark:text-red-400" title="Required">
            {" "}
            *
          </span>
        ) : (
          <span className="ml-1.5 text-k-help font-medium text-gray-500 dark:text-gray-400">
            optional
          </span>
        )}
      </label>
      <div className="flex shrink-0 items-center">
        {copyButton}
        {helpButton}
      </div>
    </div>
  );

  const trailingActionNodes = (
    <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1.5">
      {generatesOwnValue && (
        <button
          type="button"
          onClick={() => onGenerate(field.code)}
          className={trailingButtonClass}
          title={`Generate ${field.label}`}
          aria-label={`Generate ${field.label}`}
        >
          Generate
        </button>
      )}
      {offersNone && (
        <button
          type="button"
          onClick={() => onChange(field.code, "NONE")}
          className={trailingButtonClass}
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
          className="inline-flex h-k-touch w-k-touch items-center justify-center rounded-[0.5rem] bg-gray-100 text-gray-700 transition-colors hover:bg-red-100 hover:text-red-700 dark:bg-[#3A3A3A] dark:text-gray-100 dark:hover:bg-red-900/40 dark:hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <XIcon size={16} aria-hidden />
        </button>
      )}
    </div>
  );

  return (
    <div className="group flex flex-col gap-2">
      {labelRow}

      {helpText && helpOpen && (
        <div ref={helpRef}>
          <div
            id={helpId}
            role="tooltip"
            className="relative rounded-k border border-gray-300 bg-gray-50 px-3.5 py-2.5 pr-10 text-k-help leading-relaxed text-gray-800 dark:border-gray-600 dark:bg-dark-surface2 dark:text-gray-100"
          >
            {helpText}
            <button
              type="button"
              onClick={() => {
                setHelpOpen(false);
                helpButtonRef.current?.focus();
              }}
              aria-label={`Close help for ${field.code}`}
              className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <XIcon size={14} aria-hidden />
            </button>
          </div>
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
        </div>
      ) : field.type === "date" ? (
        <div className="relative flex">
          <input
            type="text"
            id={field.code}
            value={value}
            placeholder={field.dateFormat || undefined}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => {
              setTouched(true);
              handleDateBlur();
            }}
            // Roomy enough to type the separators people actually use
            // ("08/11/2026"); the blur handler folds it back to eight digits.
            maxLength={10}
            inputMode="numeric"
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            className={`${finalClass} font-mono tracking-[0.06em]`}
          />
          {trailingActionNodes}
        </div>
      ) : (
        <div className="relative flex">
          <input
            type="text"
            id={field.code}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={AAMVA_FIELD_LIMITS[field.code]}
            readOnly={!!derivedFrom}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            title={derivedFrom}
            className={`${finalClass}${derivedFrom ? " cursor-not-allowed opacity-80" : ""}`}
          />
          {trailingActionNodes}
        </div>
      )}

      {/* Everything under the control now flows instead of being pinned to
          `-bottom-4`. The absolute box was why the field grid needed a 32px gap
          it did not otherwise want, and why a two-line advisory overlapped the
          field beneath it. */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          {showAdvisory && (
            <span
              id={errorId}
              role={hasError ? "alert" : "status"}
              data-severity={hasError ? "error" : "warning"}
              title={evalResult.message}
              className={`block text-k-help font-medium field-advisory ${
                hasError ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
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
              className={`inline-flex w-fit items-center gap-1.5 rounded-[0.5rem] border px-2.5 py-1.5 text-k-help font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                showAdvisory
                  ? "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60"
                  : "border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-dark-surface2 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Wand2 size={13} aria-hidden />
              {quickFix.label}
              <span className="font-mono">{quickFix.value}</span>
            </button>
          )}
          {/* What the eight digits actually mean, so a transposed year is
              visible before it reaches the barcode. */}
          {dateReadout && !showAdvisory && (
            <span className="block text-k-help text-gray-600 dark:text-gray-400">
              {dateReadout}
            </span>
          )}
          {derivedFrom && (
            <span className="block text-k-help text-gray-600 dark:text-gray-400">
              {derivedFrom}
            </span>
          )}
          {dateChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dateChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => onChange(field.code, chip.value)}
                  title={chip.title}
                  aria-label={`Set ${field.code}: ${chip.title}`}
                  className="rounded-[0.5rem] border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-k-help font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-[#444] dark:bg-dark-surface2 dark:text-gray-300 dark:hover:bg-[#383838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
          {/* Enumerated values become one-click chips — reading the list and
              fixing the field are the same gesture. */}
          {allowedValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allowedValues.map((allowed) => (
                <button
                  key={allowed}
                  type="button"
                  onClick={() => onChange(field.code, allowed)}
                  title={`Set ${field.code} to ${allowed}`}
                  className="rounded-[0.5rem] border border-red-300 bg-red-50 px-2.5 py-1.5 font-mono text-k-help font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {allowed}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {whimsy && field.code === "DAU" && <HeightSilhouette value={value} />}
          {!field.options && maxLen && (
            <span
              className="whitespace-nowrap font-mono text-k-help text-gray-600 opacity-0 transition-opacity group-focus-within:opacity-100 dark:text-gray-400"
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
