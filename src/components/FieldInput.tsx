import React from "react";
import { Copy, Check, X as XIcon, HelpCircle } from "lucide-react";
import type { AAMVAField } from "../core/schema";
import { AAMVA_FIELD_LIMITS } from "../core/schema";
import { evaluateFieldValue } from "../core/validation";
import { getFieldHelp } from "../core/fieldHelp";

interface FieldInputProps {
  field: AAMVAField;
  value: string;
  state: string;
  strictMode: boolean;
  copied: boolean;
  onChange: (code: string, value: string) => void;
  onCopy: (code: string, value: string) => void;
  onReset: (code: string) => void;
  onGenerate: (code: string) => void;
  onDisableStrict?: () => void;
}

export const FieldInput: React.FC<FieldInputProps> = ({
  field,
  value,
  state,
  strictMode,
  copied,
  onChange,
  onCopy,
  onReset,
  onGenerate,
  onDisableStrict
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

  const helpButton = helpText ? (
    <button
      type="button"
      onClick={() => setHelpOpen((v) => !v)}
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
      {field.options ? (
        <div className="relative">
          <select
            id={field.code}
            value={value}
            onChange={(e) => onChange(field.code, e.target.value)}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-describedby={showAdvisory ? errorId : undefined}
            className={finalClass + (value ? "" : " text-transparent")}
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
          <label
            htmlFor={field.code}
            className={labelClass.replace(
              "transform top-4",
              "transform -translate-y-3 scale-75 top-4"
            )}
          >
            {field.code} — {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
        </div>
      ) : field.type === "date" ? (
        <div className="relative flex">
          <input
            type="text"
            id={field.code}
            value={value}
            placeholder={field.dateFormat || " "}
            onChange={(e) => onChange(field.code, e.target.value)}
            maxLength={AAMVA_FIELD_LIMITS[field.code] || 8}
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
            {field.code} — {field.label} {field.required && <span className="text-red-500">*</span>}
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
            onChange={(e) => onChange(field.code, e.target.value)}
            maxLength={AAMVA_FIELD_LIMITS[field.code]}
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
            {field.code} — {field.label} {field.required && <span className="text-red-500">*</span>}
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

      <div className="absolute -bottom-4 left-0 right-0 flex justify-between items-center pointer-events-none transition-opacity duration-200">
        <div className="flex-1 min-w-0">
          {showAdvisory && (
            <span
              id={errorId}
              role={hasError ? "alert" : "status"}
              data-severity={hasError ? "error" : "warning"}
              className={`block text-xs font-medium truncate pointer-events-auto ${
                hasError ? "text-red-500" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {evalResult.message ||
                (hasError
                  ? `Invalid format${field.dateFormat ? ` (e.g. ${field.dateFormat})` : ""}`
                  : "Advisory")}
              {hasError && strictMode && onDisableStrict && (
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
        </div>
        {!field.options && AAMVA_FIELD_LIMITS[field.code] && (
          <span
            aria-live="polite"
            className="text-xs font-medium text-gray-400 opacity-0 group-focus-within:opacity-100 transition-opacity ml-2 whitespace-nowrap"
          >
            {value.length}/{AAMVA_FIELD_LIMITS[field.code]}
          </span>
        )}
      </div>
    </div>
  );
};
