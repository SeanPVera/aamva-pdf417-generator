import { AAMVAField, AAMVA_FIELD_OPTIONS, AAMVA_FIELD_LIMITS } from "./schema";
import { AAMVA_STATES } from "./states";

export interface ValidationIssue {
  code: string;
  label: string;
  message: string;
}

export interface CrossFieldValidationIssue extends ValidationIssue {
  severity: "warning" | "error";
}

export type ValidatorFunc = (val: string) => boolean;
export type GeneratorFunc = (arg?: string) => string;

export interface StateRules {
  validators?: Record<string, ValidatorFunc>;
  generators?: Record<string, GeneratorFunc>;
}

const d = (n: number) => {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
};
const l = (n: number) => {
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return s;
};
const an = (n: number) => {
  const cs = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += cs[Math.floor(Math.random() * cs.length)];
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

function randomDateInRange(startYear: number, endYear: number, beforeDateStr?: string) {
  let capMs: number | null = null;
  if (beforeDateStr && /^\d{8}$/.test(beforeDateStr)) {
    const bm = parseInt(beforeDateStr.substring(0, 2), 10);
    const bd = parseInt(beforeDateStr.substring(2, 4), 10);
    const by = parseInt(beforeDateStr.substring(4, 8), 10);
    if (bm >= 1 && bm <= 12 && bd >= 1 && bd <= 31 && by >= 1900) {
      capMs = Date.UTC(by, bm - 1, bd);
    }
  }
  const rangeStart = Date.UTC(startYear, 0, 1);
  let rangeEnd = Date.UTC(endYear, 11, 31);
  if (capMs !== null && capMs < rangeEnd) {
    rangeEnd = capMs;
  }
  if (rangeEnd < rangeStart) {
    rangeEnd = rangeStart;
  }
  const ts = rangeStart + Math.floor(Math.random() * (rangeEnd - rangeStart + 1));
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
    CT: { generators: { DAQ: () => d(9), DCF: () => d(9) } },
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
      generators: { DAQ: () => d(9), DCF: () => d(10) }
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

export function validateFieldValue(
  field: AAMVAField,
  value: string,
  stateCode?: string,
  _strictMode: boolean = false
): boolean {
  if (field.required && !value) return false;
  if (!value) return true;

  const constrainedOptions = field.options || AAMVA_FIELD_OPTIONS[field.code];
  if (Array.isArray(constrainedOptions) && constrainedOptions.length > 0) {
    const allowedValues = new Set(constrainedOptions.map((opt) => opt.value));
    if (!allowedValues.has(value)) return false;
  }

  const maxLen = AAMVA_FIELD_LIMITS[field.code];
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
      if (!/^\d{8}$/.test(value)) return false;

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
      return /^\d{5}(-?\d{4})?$/.test(value);
    case "char":
      return /^[A-Z0-9]$/.test(value);
    case "string":
    default:
      return true;
  }
}

function parseAamvaDate(
  value: string,
  dateFormat: "MMDDYYYY" | "YYYYMMDD" = "MMDDYYYY"
): Date | null {
  if (!/^\d{8}$/.test(value)) return null;

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

function getDateFormatForCode(fields: AAMVAField[], code: string): "MMDDYYYY" | "YYYYMMDD" {
  const dateField = fields.find((field) => field.code === code);
  return dateField?.dateFormat === "YYYYMMDD" ? "YYYYMMDD" : "MMDDYYYY";
}

export function validateCrossFieldConsistency(
  dataObj: Record<string, string>,
  fields: AAMVAField[]
): CrossFieldValidationIssue[] {
  const issues: CrossFieldValidationIssue[] = [];

  const birthDate = dataObj.DBB
    ? parseAamvaDate(dataObj.DBB, getDateFormatForCode(fields, "DBB"))
    : null;
  const issueDate = dataObj.DBD
    ? parseAamvaDate(dataObj.DBD, getDateFormatForCode(fields, "DBD"))
    : null;
  const expiryDate = dataObj.DBA
    ? parseAamvaDate(dataObj.DBA, getDateFormatForCode(fields, "DBA"))
    : null;
  const revisionDate = dataObj.DDB
    ? parseAamvaDate(dataObj.DDB, getDateFormatForCode(fields, "DDB"))
    : null;

  if (birthDate && issueDate && issueDate < birthDate) {
    issues.push({
      code: "DBD",
      label: "Issue Date",
      severity: "error",
      message: "Issue date (DBD) cannot be earlier than date of birth (DBB)."
    });
  }

  if (issueDate && expiryDate && expiryDate < issueDate) {
    issues.push({
      code: "DBA",
      label: "Expiration Date",
      severity: "error",
      message: "Expiration date (DBA) cannot be earlier than issue date (DBD)."
    });
  }

  if (birthDate && expiryDate && expiryDate < birthDate) {
    issues.push({
      code: "DBA",
      label: "Expiration Date",
      severity: "error",
      message: "Expiration date (DBA) cannot be earlier than date of birth (DBB)."
    });
  }

  if (issueDate && revisionDate && revisionDate < issueDate) {
    issues.push({
      code: "DDB",
      label: "Card Revision Date",
      severity: "warning",
      message: "Card revision date (DDB) is earlier than issue date (DBD)."
    });
  }

  if (birthDate && issueDate) {
    const ageAtIssue =
      issueDate.getUTCFullYear() -
      birthDate.getUTCFullYear() -
      (issueDate.getUTCMonth() < birthDate.getUTCMonth() ||
      (issueDate.getUTCMonth() === birthDate.getUTCMonth() &&
        issueDate.getUTCDate() < birthDate.getUTCDate())
        ? 1
        : 0);

    if (ageAtIssue < 14) {
      issues.push({
        code: "DBB",
        label: "Date of Birth",
        severity: "warning",
        message: "Age at issue is under 14 years; verify jurisdiction-specific issuance rules."
      });
    }
  }

  return issues;
}

export function sanitizeFieldValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, "");
}

/** Returns a list of validation issues for all fields given current values. */
export function getValidationIssues(
  fields: AAMVAField[],
  values: Record<string, string>,
  stateCode: string,
  _strictMode: boolean
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const field of fields) {
    const value = values[field.code] || "";
    const valid = validateFieldValue(field, value, stateCode, _strictMode);
    if (!valid) {
      const message =
        field.required && !value ? "Required field is empty" : "Invalid format or value";
      issues.push({ code: field.code, label: field.label, message });
    }
  }
  return issues;
}
