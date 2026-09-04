import { AAMVAField, AAMVA_FIELD_OPTIONS, AAMVA_FIELD_LIMITS } from "./schema";
import { AAMVA_STATES } from "./states";
import { secureGetRandomInt } from "./crypto";

// ---------------------------------------------------------------------------
// Static regex patterns — hoisted once at module load to avoid per-call
// regex compilation overhead in hot validation paths.
// ---------------------------------------------------------------------------
const RE_8_DIGITS = /^\d{8}$/;
const RE_ZIP = /^\d{5}(-?\d{4})?$/;
const RE_CHAR_ALNUM = /^[A-Z0-9]$/;
// eslint-disable-next-line no-control-regex
const RE_CONTROL = /[\x00-\x1f\x7f]/g;

// ---------------------------------------------------------------------------
// Pre-built allowed-value Sets for AAMVA_FIELD_OPTIONS — avoids creating a
// new Set on every call to validateFieldValue / evaluateFieldValue.
// ---------------------------------------------------------------------------
const _GLOBAL_OPTION_SETS = new Map<string, Set<string>>(
  Object.entries(AAMVA_FIELD_OPTIONS).map(([code, opts]) => [
    code,
    new Set(opts.map((o) => o.value))
  ])
);

// Cache for field-specific inline options (e.g. DBC M/F in version 01).
// Keyed by the field object reference (stable module-level constants in AAMVA_VERSIONS).
const _inlineOptionSets = new WeakMap<AAMVAField, Set<string>>();

/**
 * Length cap for a field. Standard AAMVA codes carry theirs in
 * `AAMVA_FIELD_LIMITS`; jurisdiction-defined subfile elements carry their own,
 * because their codes only mean anything inside one jurisdiction and putting
 * them in the shared table would imply the standard defines them.
 */
function getMaxLength(field: AAMVAField): number | undefined {
  return AAMVA_FIELD_LIMITS[field.code] ?? field.maxLength;
}

function getAllowedSet(field: AAMVAField): Set<string> | undefined {
  if (field.options && field.options.length > 0) {
    let s = _inlineOptionSets.get(field);
    if (!s) {
      s = new Set(field.options.map((o) => o.value));
      _inlineOptionSets.set(field, s);
    }
    return s;
  }
  return _GLOBAL_OPTION_SETS.get(field.code);
}
import {
  JURISDICTION_RULE_PACKS,
  getEffectiveDateRules,
  getJurisdictionRulePack,
  Severity
} from "./jurisdictionRules";

export interface ValidationIssue {
  code: string;
  label: string;
  message: string;
  severity: Severity;
  /**
   * Whether the field is blank or holds something the validator rejects.
   *
   * Both block generation, so both are `severity: "error"` — but they are not
   * the same message to a person. A form nobody has touched is *entirely*
   * `"empty"`, and rendering that as failure opened the app with 174 red
   * elements and a "20 errors" count before a single keystroke. By the time
   * something was genuinely wrong, red meant nothing.
   *
   * Count and colour these separately: `"empty"` is work remaining, `"invalid"`
   * is a mistake. Cross-field issues are always `"invalid"` — they compare
   * values that exist.
   */
  kind: "empty" | "invalid";
}

export type CrossFieldValidationIssue = ValidationIssue;

export type ValidatorFunc = (val: string) => boolean;
export type GeneratorFunc = (arg?: string) => string;

export interface StateRules {
  validators?: Record<string, ValidatorFunc>;
  generators?: Record<string, GeneratorFunc>;
}

const d = (n: number) => {
  let s = "";
  for (let i = 0; i < n; i++) s += secureGetRandomInt(10);
  return s;
};
const l = (n: number) => {
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(65 + secureGetRandomInt(26));
  return s;
};
const an = (n: number) => {
  const cs = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += cs[secureGetRandomInt(cs.length)];
  return s;
};
/** Like `an`, but over the full alphabet — for issuers observed using I/O/0/1. */
const alnum = (n: number) => {
  const cs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += cs[secureGetRandomInt(cs.length)];
  return s;
};

const VERSION_ERA_RANGES: Record<string, [number, number]> = {
  "10": [2019, 2024],
  "09": [2015, 2020],
  "08": [2013, 2017],
  "07": [2012, 2015],
  "06": [2011, 2014],
  "05": [2010, 2013],
  "04": [2009, 2012]
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Connecticut's document discriminator, in the shape a real CT card carries:
 * 18 characters opening with the issue date as YYMMDD, then a timestamp-like
 * run of digits, a two-digit sequence, and a four-character alphanumeric tail
 * (observed as letter-digit-digit-letter).
 *
 * The issue date is threaded through so the DCF agrees with DBD on the same
 * card. Without one there is nothing to derive it from, so a plausible recent
 * date is used rather than inventing a correspondence that does not hold.
 */
function ctDiscriminator(issueDateStr?: string): string {
  let yymmdd: string;
  if (issueDateStr && RE_8_DIGITS.test(issueDateStr)) {
    // Issue dates are MMDDYYYY on the wire for every version that reaches CT.
    yymmdd = issueDateStr.substring(6, 8) + issueDateStr.substring(0, 4);
  } else {
    yymmdd = d(2) + String(1 + secureGetRandomInt(12)).padStart(2, "0") + "15";
  }
  return (
    yymmdd +
    d(6) +
    d(2) +
    String.fromCharCode(65 + secureGetRandomInt(26)) +
    d(2) +
    String.fromCharCode(65 + secureGetRandomInt(26))
  );
}

function randomDateInRange(startYear: number, endYear: number, beforeDateStr?: string) {
  let capMs: number | null = null;
  if (beforeDateStr && RE_8_DIGITS.test(beforeDateStr)) {
    const bm = parseInt(beforeDateStr.substring(0, 2), 10);
    const bd = parseInt(beforeDateStr.substring(2, 4), 10);
    const by = parseInt(beforeDateStr.substring(4, 8), 10);
    if (bm >= 1 && bm <= 12 && bd >= 1 && bd <= 31 && by >= 1900) {
      capMs = Date.UTC(by, bm - 1, bd);
    }
  }
  let rangeStart = Date.UTC(startYear, 0, 1);
  let rangeEnd = Date.UTC(endYear, 11, 31);
  if (capMs !== null && capMs < rangeEnd) {
    rangeEnd = capMs;
  }
  if (rangeEnd < rangeStart) {
    // The issue date predates this AAMVA version's era. Slide the window back
    // to sit behind the cap rather than snapping forward to the era start —
    // otherwise the generated card revision date postdates the issue date,
    // which the cross-field check flags and strict mode then refuses to build.
    rangeStart = rangeEnd - ONE_YEAR_MS;
  }
  const ts = rangeStart + secureGetRandomInt(rangeEnd - rangeStart + 1);
  const dt = new Date(ts);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  const yyyy = String(dt.getUTCFullYear());
  return mm + dd + yyyy;
}

export const AAMVA_STATE_RULES: Record<string, StateRules> = (() => {
  const rules: Record<string, StateRules> = {
    AL: { generators: { DAQ: () => d(7), DCF: () => d(8) } },
    AK: { generators: { DAQ: () => d(7), DCF: () => l(2) + d(8) } },
    AZ: { generators: { DAQ: () => l(1) + d(8), DCF: () => l(2) + d(8) } },
    AR: { generators: { DAQ: () => d(9), DCF: () => d(9) } },
    CA: {
      validators: { DAQ: (val) => /^[A-Z][0-9]{7}$/.test(val) },
      generators: { DAQ: () => l(1) + d(7), DCF: () => l(2) + d(4) + "/" + d(4) + "/" + d(4) }
    },
    CO: { generators: { DAQ: () => d(9), DCF: () => l(2) + d(8) } },
    CT: { generators: { DAQ: () => d(9), DCF: (issueDateStr) => ctDiscriminator(issueDateStr) } },
    DE: { generators: { DAQ: () => d(7), DCF: () => d(8) } },
    FL: {
      validators: { DAQ: (val) => /^[A-Z][0-9]{12}$/.test(val) },
      generators: { DAQ: () => l(1) + d(12), DCF: () => l(1) + d(11) }
    },
    GA: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    HI: { generators: { DAQ: () => l(1) + d(8), DCF: () => l(2) + d(8) } },
    ID: { generators: { DAQ: () => l(2) + d(6) + l(1), DCF: () => l(2) + d(8) } },
    IL: { generators: { DAQ: () => l(1) + d(11), DCF: () => l(3) + d(9) } },
    IN: { generators: { DAQ: () => d(10), DCF: () => d(10) } },
    IA: { generators: { DAQ: () => d(9), DCF: () => d(9) } },
    KS: { generators: { DAQ: () => l(1) + d(8), DCF: () => l(2) + d(8) } },
    KY: { generators: { DAQ: () => l(1) + d(8), DCF: () => d(8) } },
    LA: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    ME: { generators: { DAQ: () => d(7), DCF: () => d(8) } },
    MD: { generators: { DAQ: () => l(1) + d(12), DCF: () => l(2) + d(10) } },
    MA: { generators: { DAQ: () => l(1) + d(8), DCF: () => l(2) + d(9) } },
    MI: { generators: { DAQ: () => l(1) + d(12), DCF: () => l(1) + d(10) } },
    MN: { generators: { DAQ: () => l(1) + d(12), DCF: () => l(1) + d(9) } },
    MS: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    MO: { generators: { DAQ: () => l(1) + d(9), DCF: () => d(10) } },
    MT: { generators: { DAQ: () => d(9), DCF: () => an(9) } },
    NE: { generators: { DAQ: () => l(1) + d(8), DCF: () => l(2) + d(8) } },
    NV: { generators: { DAQ: () => d(10), DCF: () => d(10) } },
    NH: { generators: { DAQ: () => d(2) + l(3) + d(5), DCF: () => l(2) + d(8) } },
    NJ: { generators: { DAQ: () => l(1) + d(14), DCF: () => l(2) + d(10) } },
    NM: { generators: { DAQ: () => d(9), DCF: () => d(9) } },
    NY: {
      validators: { DAQ: (val) => /^[0-9]{9}$/.test(val) },
      // A decoded NY card carries a 10-character mixed letter/digit
      // discriminator ("KMEMI7FG20"), not the 10 digits this used to mint.
      // `an` excludes look-alike characters; NY uses the full alphabet, so this
      // draws from it directly.
      generators: { DAQ: () => d(9), DCF: () => alnum(10) }
    },
    NC: { generators: { DAQ: () => d(12), DCF: () => l(2) + d(8) } },
    ND: { generators: { DAQ: () => l(3) + d(6), DCF: () => d(9) } },
    OH: { generators: { DAQ: () => l(2) + d(6), DCF: () => an(8) } },
    OK: { generators: { DAQ: () => l(1) + d(9), DCF: () => d(10) } },
    OR: { generators: { DAQ: () => d(7), DCF: () => l(2) + d(8) } },
    PA: { generators: { DAQ: () => d(8), DCF: () => l(2) + d(8) } },
    RI: { generators: { DAQ: () => d(7), DCF: () => d(8) } },
    SC: { generators: { DAQ: () => d(9), DCF: () => l(2) + d(8) } },
    SD: { generators: { DAQ: () => d(8), DCF: () => d(8) } },
    TN: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    TX: {
      validators: { DAQ: (val) => /^[0-9]{8}$/.test(val) },
      generators: { DAQ: () => d(8), DCF: () => d(2) + l(6) + d(4) }
    },
    UT: { generators: { DAQ: () => d(9), DCF: () => d(9) } },
    VT: { generators: { DAQ: () => d(8), DCF: () => l(2) + d(8) } },
    VA: { generators: { DAQ: () => l(1) + d(8), DCF: () => l(2) + d(9) } },
    WA: { generators: { DAQ: () => l(7) + d(5), DCF: () => l(2) + d(10) } },
    WV: { generators: { DAQ: () => l(1) + d(6), DCF: () => d(8) } },
    WI: { generators: { DAQ: () => l(1) + d(13), DCF: () => l(2) + d(8) } },
    WY: { generators: { DAQ: () => d(9), DCF: () => d(9) } },
    DC: { generators: { DAQ: () => d(7), DCF: () => d(10) } },
    AS: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    GU: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    VI: { generators: { DAQ: () => d(9), DCF: () => d(10) } },
    PR: { generators: { DAQ: () => d(9), DCF: () => d(10) } }
  };

  for (const state of Object.keys(rules)) {
    const stateDef = AAMVA_STATES[state];
    const rule = rules[state];
    if (!stateDef || !rule || !rule.generators) continue;
    const ver = stateDef.aamvaVersion;
    const range = VERSION_ERA_RANGES[ver] || VERSION_ERA_RANGES["09"];
    if (!range) continue;
    const [start, end] = range;
    rule.generators.DDB = (issueDateStr?: string) => randomDateInRange(start, end, issueDateStr);
  }

  return rules;
})();

/**
 * Structural validation: enumerations, length limits, jurisdiction validators,
 * and type-specific format checks. Deliberately has no strict-mode parameter —
 * none of these checks are ever advisory, and the one it used to take was
 * accepted, forwarded by two callers, and then completely ignored. Severity and
 * strict-mode promotion live in `evaluateFieldValue`.
 */
export function validateFieldValue(field: AAMVAField, value: string, stateCode?: string): boolean {
  if (field.required && !value) return false;
  if (!value) return true;

  const allowedValues = getAllowedSet(field);
  if (allowedValues && !allowedValues.has(value)) return false;

  const maxLen = getMaxLength(field);
  if (maxLen && value.length > maxLen) return false;

  if (stateCode && AAMVA_STATE_RULES[stateCode]?.validators) {
    const validator = AAMVA_STATE_RULES[stateCode].validators![field.code];
    if (validator && !validator(value)) {
      return false;
    }
  }

  switch (field.type) {
    case "date": {
      const dateFormat = field.dateFormat || "MMDDYYYY";
      if (!RE_8_DIGITS.test(value)) return false;

      let year, month, day;
      if (dateFormat === "YYYYMMDD") {
        year = parseInt(value.substring(0, 4), 10);
        month = parseInt(value.substring(4, 6), 10);
        day = parseInt(value.substring(6, 8), 10);
      } else {
        month = parseInt(value.substring(0, 2), 10);
        day = parseInt(value.substring(2, 4), 10);
        year = parseInt(value.substring(4, 8), 10);
      }

      if (year < 1800 || year > 2200) return false;
      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;

      const dt = new Date(Date.UTC(year, month - 1, day));
      return (
        dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
      );
    }
    case "zip":
      return RE_ZIP.test(value);
    case "char":
      return RE_CHAR_ALNUM.test(value);
    case "string":
    default:
      return true;
  }
}

function parseAamvaDate(
  value: string,
  dateFormat: "MMDDYYYY" | "YYYYMMDD" = "MMDDYYYY"
): Date | null {
  if (!RE_8_DIGITS.test(value)) return null;

  let year: number;
  let month: number;
  let day: number;

  if (dateFormat === "YYYYMMDD") {
    year = parseInt(value.substring(0, 4), 10);
    month = parseInt(value.substring(4, 6), 10);
    day = parseInt(value.substring(6, 8), 10);
  } else {
    month = parseInt(value.substring(0, 2), 10);
    day = parseInt(value.substring(2, 4), 10);
    year = parseInt(value.substring(4, 8), 10);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function buildDateFormatMap(fields: AAMVAField[]): Map<string, "MMDDYYYY" | "YYYYMMDD"> {
  const map = new Map<string, "MMDDYYYY" | "YYYYMMDD">();
  for (const f of fields) {
    if (f.type === "date") {
      map.set(f.code, f.dateFormat === "YYYYMMDD" ? "YYYYMMDD" : "MMDDYYYY");
    }
  }
  return map;
}

function ageAtDate(birth: Date, target: Date): number {
  return (
    target.getUTCFullYear() -
    birth.getUTCFullYear() -
    (target.getUTCMonth() < birth.getUTCMonth() ||
    (target.getUTCMonth() === birth.getUTCMonth() && target.getUTCDate() < birth.getUTCDate())
      ? 1
      : 0)
  );
}

function diffYears(start: Date, end: Date): number {
  const years = end.getUTCFullYear() - start.getUTCFullYear();
  const cmp = end.getUTCMonth() - start.getUTCMonth() || end.getUTCDate() - start.getUTCDate();
  return cmp < 0 ? years - 1 : years;
}

/**
 * Returns the highest-tier vehicle classes encoded in DCA. AAMVA permits
 * comma- or pipe-separated tokens; we tolerate either and ignore whitespace.
 */
function parseVehicleClasses(dca?: string): string[] {
  if (!dca) return [];
  return dca
    .split(/[,|/\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function validateCrossFieldConsistency(
  dataObj: Record<string, string>,
  fields: AAMVAField[],
  stateCode?: string
): CrossFieldValidationIssue[] {
  const issues: CrossFieldValidationIssue[] = [];

  // Single-pass Map built once; replaces 4 separate Array.find() calls.
  const dateFormats = buildDateFormatMap(fields);

  const birthDate = dataObj.DBB
    ? parseAamvaDate(dataObj.DBB, dateFormats.get("DBB") ?? "MMDDYYYY")
    : null;
  const issueDate = dataObj.DBD
    ? parseAamvaDate(dataObj.DBD, dateFormats.get("DBD") ?? "MMDDYYYY")
    : null;
  const expiryDate = dataObj.DBA
    ? parseAamvaDate(dataObj.DBA, dateFormats.get("DBA") ?? "MMDDYYYY")
    : null;
  const revisionDate = dataObj.DDB
    ? parseAamvaDate(dataObj.DDB, dateFormats.get("DDB") ?? "MMDDYYYY")
    : null;

  if (birthDate && issueDate && issueDate < birthDate) {
    issues.push({
      code: "DBD",
      label: "Issue Date",
      kind: "invalid",
      severity: "error",
      message: "Issue date (DBD) cannot be earlier than date of birth (DBB)."
    });
  }

  if (issueDate && expiryDate && expiryDate < issueDate) {
    issues.push({
      code: "DBA",
      label: "Expiration Date",
      kind: "invalid",
      severity: "error",
      message: "Expiration date (DBA) cannot be earlier than issue date (DBD)."
    });
  }

  if (birthDate && expiryDate && expiryDate < birthDate) {
    issues.push({
      code: "DBA",
      label: "Expiration Date",
      kind: "invalid",
      severity: "error",
      message: "Expiration date (DBA) cannot be earlier than date of birth (DBB)."
    });
  }

  if (issueDate && revisionDate && revisionDate > issueDate) {
    issues.push({
      code: "DDB",
      label: "Card Revision Date",
      kind: "invalid",
      severity: "warning",
      message: "Card revision date (DDB) is later than issue date (DBD)."
    });
  }

  // Date-rule layer: pull jurisdiction-specific (or default) bounds.
  const dateRules = getEffectiveDateRules(stateCode || "");

  if (birthDate && issueDate) {
    const ageAtIssue = ageAtDate(birthDate, issueDate);

    const minAge = dateRules.minIssuanceAge ?? 14;
    if (ageAtIssue < minAge) {
      issues.push({
        code: "DBB",
        label: "Date of Birth",
        kind: "invalid",
        severity: "warning",
        message:
          minAge > 14 && stateCode
            ? `Age at issue (${ageAtIssue}) is below the ${stateCode} minimum of ${minAge} years.`
            : `Age at issue is under ${minAge} years; verify jurisdiction-specific issuance rules.`
      });
    }
  }

  if (issueDate && expiryDate && dateRules.maxValidityYears !== undefined) {
    const span = diffYears(issueDate, expiryDate);
    if (span > dateRules.maxValidityYears) {
      issues.push({
        code: "DBA",
        label: "Expiration Date",
        kind: "invalid",
        severity: "warning",
        message: `Validity period (${span} yrs) exceeds the ${stateCode || "default"} maximum of ${dateRules.maxValidityYears} years.`
      });
    }
  }

  if (issueDate && expiryDate && dateRules.minValidityYears !== undefined) {
    const span = diffYears(issueDate, expiryDate);
    if (span < dateRules.minValidityYears) {
      issues.push({
        code: "DBA",
        label: "Expiration Date",
        kind: "invalid",
        severity: "warning",
        message: `Validity period (${span} yrs) is shorter than the ${stateCode || "default"} minimum of ${dateRules.minValidityYears} years.`
      });
    }
  }

  // Class-minimum-age constraints from the rule pack (hard error: a 14-year-old
  // can't legally hold a Class A CDL).
  if (stateCode && birthDate && issueDate) {
    const pack = JURISDICTION_RULE_PACKS[stateCode];
    if (pack?.classMinimumAges && dataObj.DCA) {
      const ageAtIssue = ageAtDate(birthDate, issueDate);
      for (const cls of parseVehicleClasses(dataObj.DCA)) {
        const required = pack.classMinimumAges[cls];
        if (required !== undefined && ageAtIssue < required) {
          issues.push({
            code: "DCA",
            label: "Vehicle Class",
            kind: "invalid",
            severity: "error",
            message: `Class ${cls} requires age ≥ ${required} in ${stateCode}; holder is ${ageAtIssue} at issuance.`
          });
        }
      }
    }
  }

  // Derived-field consistency: when both `DAA` (full name) and the split
  // name fields (DCS/DAC/DAD) are present, they should agree on family name
  // and first name. Spec allows DAA only on V01, but some encoders include it
  // alongside split names — flag obvious mismatches as warnings.
  if (dataObj.DAA && dataObj.DCS) {
    const family =
      dataObj.DAA.split(/[,\s]+/)[0]
        ?.toUpperCase()
        .trim() || "";
    if (family && family !== dataObj.DCS.toUpperCase().trim()) {
      issues.push({
        code: "DAA",
        label: "Full Name",
        kind: "invalid",
        severity: "warning",
        message: `Full name (DAA) family component "${family}" does not match DCS "${dataObj.DCS.toUpperCase().trim()}".`
      });
    }
  }

  // A "T" (truncated) flag implies the corresponding name was actually
  // present but truncated; an empty value alongside "T" is contradictory.
  // "N" with empty is acceptable — it just means "no middle name, not
  // truncated." "U" (unknown) is always permitted.
  const truncationPairs: Array<[string, string, string]> = [
    ["DDE", "DCS", "Family Name"],
    ["DDF", "DAC", "First Name"],
    ["DDG", "DAD", "Middle Name"]
  ];
  for (const [flag, name, label] of truncationPairs) {
    if (dataObj[flag] === "T" && !dataObj[name]) {
      issues.push({
        code: flag,
        label: `${label} Truncation`,
        kind: "invalid",
        severity: "warning",
        message: `${flag} is "T" (truncated) but ${name} (${label}) is empty.`
      });
    }
  }

  return issues;
}

export function sanitizeFieldValue(value: string): string {
  return value.replace(RE_CONTROL, "");
}

/**
 * Reports an evaluation of a single field with severity. Unlike
 * `validateFieldValue`, this surfaces *why* a field failed and at what
 * severity tier.
 */
export interface FieldEvaluation {
  ok: boolean;
  severity: Severity;
  message?: string;
}

/**
 * `strictMode` promotes jurisdiction rule-pack advisories from warnings to
 * blocking errors, which is what "strict mode treats warnings as errors" has
 * always claimed to mean. Every other check here is unconditional.
 */
export function evaluateFieldValue(
  field: AAMVAField,
  value: string,
  stateCode?: string,
  strictMode: boolean = false
): FieldEvaluation {
  if (field.required && !value) {
    return { ok: false, severity: "error", message: "Required field is empty." };
  }
  if (!value) return { ok: true, severity: "info" };

  const allowed = getAllowedSet(field);
  if (allowed && !allowed.has(value)) {
    return {
      ok: false,
      severity: "error",
      message: `Value must be one of: ${[...allowed].join(", ")}.`
    };
  }

  const maxLen = getMaxLength(field);
  if (maxLen && value.length > maxLen) {
    return {
      ok: false,
      severity: "error",
      message: `Exceeds maximum length of ${maxLen} characters.`
    };
  }

  if (stateCode) {
    const stateValidator = AAMVA_STATE_RULES[stateCode]?.validators?.[field.code];
    if (stateValidator && !stateValidator(value)) {
      return {
        ok: false,
        severity: "error",
        message: `Invalid format for ${stateCode} ${field.label}.`
      };
    }
  }

  if (!validateFieldValue(field, value, stateCode)) {
    let msg = "Invalid format or value.";
    if (field.type === "date") {
      msg = `Invalid date format (expected ${field.dateFormat || "MMDDYYYY"}).`;
    } else if (field.type === "zip") {
      msg = "Invalid postal code format.";
    } else if (field.type === "char") {
      msg = "Must be a single alphanumeric character.";
    }
    return { ok: false, severity: "error", message: msg };
  }

  // Layer rule-pack constraints (regex patterns) on top of the structural
  // checks. These can be either errors or warnings depending on the pack.
  //
  // Every violation is examined and the most severe one wins. Returning on the
  // first failure meant a warning-severity constraint listed ahead of an
  // error-severity one masked the error entirely and reported `ok: true`.
  if (stateCode) {
    const pack = JURISDICTION_RULE_PACKS[stateCode];
    if (pack?.constraints) {
      let worst: FieldEvaluation | null = null;
      for (const c of pack.constraints) {
        if (c.field !== field.code) continue;
        if (c.pattern && !c.pattern.test(value)) {
          if (c.severity === "error") {
            return { ok: false, severity: "error", message: c.message };
          }
          // Strict mode promotes the advisory into a blocker.
          worst ??= strictMode
            ? { ok: false, severity: "error", message: c.message }
            : { ok: true, severity: c.severity, message: c.message };
        }
      }
      if (worst) return worst;
    }
  }

  return { ok: true, severity: "info" };
}

/** Returns a list of validation issues for all fields given current values. */
export function getValidationIssues(
  fields: AAMVAField[],
  values: Record<string, string>,
  stateCode: string,
  strictMode: boolean
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const field of fields) {
    const value = values[field.code] || "";
    const evalResult = evaluateFieldValue(field, value, stateCode, strictMode);
    if (!evalResult.ok || evalResult.severity === "warning") {
      issues.push({
        code: field.code,
        label: field.label,
        message: evalResult.message ?? "Invalid format or value.",
        severity: evalResult.severity === "info" ? "error" : evalResult.severity,
        kind: value.trim() ? "invalid" : "empty"
      });
    }
  }

  // Rule-pack: additional required fields (jurisdiction-mandated even if
  // the version's schema marks them optional).
  const pack = stateCode ? getJurisdictionRulePack(stateCode) : undefined;
  const seen = new Set(issues.map((i) => `${i.code}:${i.severity}`));

  if (pack?.additionalRequiredFields) {
    for (const code of pack.additionalRequiredFields) {
      if (!values[code]) {
        const field = fields.find((f) => f.code === code);
        const key = `${code}:error`;
        if (seen.has(key)) continue;
        issues.push({
          code,
          label: field?.label ?? code,
          message: `Required by ${stateCode}: this field cannot be empty.`,
          severity: "error",
          kind: "empty"
        });
        seen.add(key);
      }
    }
  }

  if (pack?.recommendedFields) {
    for (const code of pack.recommendedFields) {
      if (!values[code]) {
        const field = fields.find((f) => f.code === code);
        const key = `${code}:warning`;
        if (seen.has(key)) continue;
        issues.push({
          code,
          label: field?.label ?? code,
          message: `Recommended by ${stateCode}: consider providing a value.`,
          severity: "warning",
          kind: "empty"
        });
        seen.add(key);
      }
    }
  }

  // Cross-field issues are appended so the UI can render them inline with
  // per-field issues.
  const cross = validateCrossFieldConsistency(values, fields, stateCode);
  for (const ci of cross) {
    issues.push(ci);
  }

  // Blockers first. Rule-pack warnings and cross-field issues are appended
  // after the per-field pass, so without this an error can sort below a
  // warning and the user has to hunt for what is actually blocking them.
  // Array.prototype.sort is stable, so ordering within a severity is kept.
  return issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

/** Sort weight for issue severity — lower sorts first. */
function severityRank(severity: ValidationIssue["severity"]): number {
  return severity === "error" ? 0 : 1;
}

/** Returns true when the issue list contains any blocking errors. */
export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
