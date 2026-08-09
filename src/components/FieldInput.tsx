import React from "react";
import { Copy, Check, X as XIcon, HelpCircle } from "lucide-react";
import type { AAMVAField } from "../core/schema";
import { AAMVA_FIELD_LIMITS } from "../core/schema";
import { evaluateFieldValue } from "../core/validation";
import { getFieldHelp } from "../core/fieldHelp";
import { HeightSilhouette } from "./HeightSilhouette";

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
  onChange: (code: string, value: string) => void;
  onCopy: (code: string, value: string) => void;
  onReset: (code: string) => void;
  onGenerate: (code: string) => void;
  onDisableStrict?: () => void;
  onHelpOpened?: (code: string) => void;
}

export const FieldInput: React.FC<FieldInputProps> = ({
  field,
  value,
  state,
  strictMode,
  copied,
  whimsy = false,
  onChange,
  onCopy,
  onReset,
  onGenerate,
  onDisableStrict,
  onHelpOpened
}) => {
  const evalResult = evaluateFieldValue(field, value, state, strictMode);
  const isWarning = !!value && evalResult.severity === "warning";
  const hasError = !!value && !evalResult.ok && !isWarning;
  const showAdvisory = hasError || isWarning;
  const errorId = `error-${field.code}`;
  const helpId = `help-${field.code}`;
  const helpText = getFieldHelp(field.code);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const isResettable = field.code === "DCF" || field.code === "DAQ" || field.code === "DDB";
  const allowedValues = hasError ? parseAllowedValues(evalResult.message) : [];
  const maxLen = AAMVA_FIELD_LIMITS[field.code];

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

  const helpButton = helpText ? (
    <button
      type="button"
      onClick={() => {
        setHelpOpen((v) => {
          if (!v) onHelpOpened?.(field.code);
          return !v;
        });
      }}
      onBlur={() => setHelpOpen(false)}
      aria-expanded={helpOpen}
      aria-controls={helpId}
      aria-label={`Help for ${field.code}`}
      title={`What is ${field.code}?`}
      className="absolute top-1 right-7 z-30 p-1 rounded text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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

  const labelClass = `absolute text-sm duration-300 transform top-4 z-10 origin-[0] left-3 pointer-events-none ${
    hasError
      ? "text-red-500"
      : isWarning
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-500 dark:text-gray-400 peer-focus:text-brand-500 peer-focus:dark:text-brand-400"
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
      {helpButton}
      {helpOpen && helpText && (
        <div
          id={helpId}
          role="tooltip"
          className="absolute z-40 top-full left-0 right-0 mt-1 px-3 py-2 text-xs leading-snug rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 shadow-lg"
        >
          {helpText}
        </div>
      )}
      <div className="relative flex">
        {field.options ? (
          <select
            id={field.code}
            value={value}
            onChange={(e) => onChange(field.code, e.target.value)}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            className={`${finalClass} ${value ? "" : "text-transparent"} flex-1`}
          >
            <option value="" disabled className="text-gray-500 dark:text-gray-400">
              Select...
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
        ) : (
          <input
            type="text"
            id={field.code}
            value={value}
            placeholder={field.dateFormat || " "}
            onChange={(e) => onChange(field.code, e.target.value)}
            maxLength={
              field.type === "date"
                ? AAMVA_FIELD_LIMITS[field.code] || 8
                : AAMVA_FIELD_LIMITS[field.code]
            }
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            className={`${finalClass} float-label-input flex-1`}
          />
        )}

        <label
          htmlFor={field.code}
          className={labelClass.replace(
            "transform top-4",
            "transform -translate-y-3 scale-75 top-4"
          )}
        >
          {field.code} — {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>

        {!field.options && (
          <div className="absolute right-1.5 top-2 bottom-2 flex gap-1 z-20">
            {(field.code === "DDB" || field.code === "DCF" || field.code === "DAQ") && (
              <button
                type="button"
                onClick={() => onGenerate(field.code)}
                className="text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-[#444] dark:hover:bg-[#555] rounded px-2 text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title={
                  field.code === "DDB" ? "Generate Card Revision Date" : `Generate ${field.label}`
                }
                aria-label={
                  field.code === "DDB" ? "Generate Card Revision Date" : `Generate ${field.label}`
                }
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
        )}
      </div>

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
              className="text-xs font-medium text-gray-400 opacity-0 group-focus-within:opacity-100 transition-opacity whitespace-nowrap"
              aria-hidden
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
