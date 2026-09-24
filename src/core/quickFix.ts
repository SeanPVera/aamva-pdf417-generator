// Deterministic repairs for field values the validator rejects.
//
// Most validation failures in this app are transcription noise rather than
// genuine ambiguity: a name pasted in title case, a date typed with slashes, a
// height written as 5'9", "BROWN" where the spec wants "BRO". Each of those has
// exactly one correct answer, and making the user retype it is busywork.
//
// The hard rule here is that a quick fix never invents data. Every repair is a
// pure rewrite of what the user already typed, and a candidate is only offered
// once `evaluateFieldValue` agrees the rewrite actually passes — so a "Fix"
// button can never leave a field still broken.

import { AAMVA_FIELD_OPTIONS, type AAMVAField } from "./schema";
import { evaluateFieldValue } from "./validation";
import { normalizeDateInput } from "./dateHelpers";

export interface QuickFix {
  /** Field code the fix applies to. */
  code: string;
  /** Short button label, e.g. "Uppercase". */
  label: string;
  /** Sentence for the tooltip / screen readers. */
  description: string;
  /** The repaired value. */
  value: string;
}

/**
 * Spelled-out values that map onto a code but share no usable prefix with it.
 * Prefix matching covers BROWN→BRO and BLACK→BLK; these are the ones it can't.
 */
const VALUE_ALIASES: Record<string, Record<string, string>> = {
  DBC: {
    M: "1",
    MALE: "1",
    F: "2",
    FEMALE: "2",
    X: "9",
    U: "9",
    UNKNOWN: "9",
    UNSPECIFIED: "9",
    "NOT SPECIFIED": "9"
  },
  DAY: {
    BROWN: "BRO",
    BLACK: "BLK",
    BLUE: "BLU",
    GREEN: "GRN",
    GRAY: "GRY",
    GREY: "GRY",
    HAZEL: "HAZ",
    HAZLE: "HAZ"
  },
  DAZ: {
    BROWN: "BRO",
    BLACK: "BLK",
    BLOND: "BLN",
    BLONDE: "BLN",
    GRAY: "GRY",
    GREY: "GRY",
    WHITE: "WHI",
    RED: "RED",
    BALD: "BAL"
  },
  DCG: {
    US: "USA",
    "U.S.": "USA",
    "UNITED STATES": "USA",
    AMERICA: "USA",
    CA: "CAN",
    CANADA: "CAN",
    MX: "MEX",
    MEXICO: "MEX"
  },
  DDA: {
    "REAL ID": "F",
    REALID: "F",
    COMPLIANT: "F",
    Y: "F",
    YES: "F",
    NONCOMPLIANT: "N",
    "NON-COMPLIANT": "N",
    NO: "N"
  },
  DDK: { Y: "1", YES: "1", DONOR: "1", N: "0", NO: "0" },
  DDL: { Y: "1", YES: "1", VETERAN: "1", N: "0", NO: "0" },
  DDE: { TRUNCATED: "T", NO: "N", NONE: "N", UNKNOWN: "U" },
  DDF: { TRUNCATED: "T", NO: "N", NONE: "N", UNKNOWN: "U" },
  DDG: { TRUNCATED: "T", NO: "N", NONE: "N", UNKNOWN: "U" }
};

/** Boundary spaces only. Identity data must never be transliterated or deleted. */
function sanitize(value: string): string {
  return value.trim();
}

/** Allowed values for a field, from its inline options or the global table. */
function allowedValues(field: AAMVAField): string[] {
  if (field.options && field.options.length > 0) return field.options.map((o) => o.value);
  return (AAMVA_FIELD_OPTIONS[field.code] ?? []).map((o) => o.value);
}

/** Only exact codes and explicit, unambiguous spelling aliases are repairable. */
function matchAllowedValue(field: AAMVAField, value: string): string | null {
  const allowed = allowedValues(field);
  if (allowed.length === 0) return null;
  const upper = value.toUpperCase().trim();
  if (allowed.includes(upper)) return upper;

  const alias = VALUE_ALIASES[field.code]?.[upper];
  if (alias && allowed.includes(alias)) return alias;

  return null;
}

/**
 * A bare three-digit height that reads as feet-and-inches rather than inches.
 *
 * New York encodes height this way — a decoded NY card carries `603` for 6'3"
 * — and the shape is unambiguous where it applies: `603` as inches would be
 * fifty feet, and nobody 4'0" to 7'11" has an inch count in that range. The
 * check exists so the "reformat" rewrite leaves those values alone; reading
 * `603` as inches and rewriting it `603 IN` changed a real cardholder's height
 * by a factor of eight.
 */
function isFeetInchesNotation(raw: string): boolean {
  const m = /^([4-7])(\d{2})$/.exec(raw);
  return m !== null && parseInt(m[2]!, 10) <= 11;
}

/** `5'9"`, `5-9`, `5 ft 9 in`, `69`, `69in` → `069 IN`; `175cm` → `175 CM`. */
function normalizeHeight(value: string): string | null {
  const raw = sanitize(value).toUpperCase();
  if (!raw) return null;

  const cm = /^(\d{2,3})\s*(?:CM|CENTIMET(?:ER|RE)S?)$/.exec(raw);
  if (cm) return `${cm[1]!.padStart(3, "0")} CM`;

  // Checked before the separator-based patterns so a bare `510` is not read as
  // "5 feet 10" by the whitespace branch either — it is already on the wire in
  // the form its jurisdiction writes, and there is nothing to reformat.
  if (isFeetInchesNotation(raw)) return null;

  const feetInches = /^(\d)\s*(?:'|FT|FEET|-|\s)\s*(\d{1,2})\s*(?:"|''|IN|INCHES)?$/.exec(raw);
  if (feetInches) {
    if (parseInt(feetInches[2]!, 10) > 11) return null;
    const total = parseInt(feetInches[1]!, 10) * 12 + parseInt(feetInches[2]!, 10);
    if (total >= 12 && total <= 999) return `${String(total).padStart(3, "0")} IN`;
  }

  const feetOnly = /^(\d)\s*(?:'|FT|FEET)$/.exec(raw);
  if (feetOnly) return `${String(parseInt(feetOnly[1]!, 10) * 12).padStart(3, "0")} IN`;

  const inches = /^(\d{2,3})\s*(?:IN|INCHES|")?$/.exec(raw);
  if (inches) return `${inches[1]!.padStart(3, "0")} IN`;

  return null;
}

/** Digits-only ZIP, keeping the 5 or 9 digit shapes AAMVA accepts. */
function normalizeZip(value: string): string | null {
  if (!/^[0-9 -]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 5 || digits.length === 9) return digits;
  return null;
}

interface Candidate {
  label: string;
  describe: (value: string) => string;
  value: string;
  /**
   * True when the rewrite is what the encoder would produce anyway — casing,
   * padding, notation. These are offered even for values that already validate,
   * because "valid" and "what ends up in the barcode" are not the same thing.
   */
  canonical?: boolean;
}

/**
 * Builds the ordered list of repair candidates for a value. Earlier entries are
 * more specific; the first one that validates wins.
 */
function buildCandidates(field: AAMVAField, value: string): Candidate[] {
  if (field.subfile === "jurisdiction" || field.code.startsWith("Z") || /[^\x20-\x7e]/.test(value))
    return [];
  const candidates: Candidate[] = [];
  const clean = sanitize(value);

  if (field.type === "date") {
    const normalized = normalizeDateInput(
      clean,
      field.dateFormat === "YYYYMMDD" ? "YYYYMMDD" : "MMDDYYYY"
    );
    if (normalized && normalized !== value) {
      candidates.push({
        label: "Reformat",
        describe: (v) => `Rewrite as ${field.dateFormat || "MMDDYYYY"}: ${v}`,
        value: normalized
      });
    }
  }

  if (allowedValues(field).length > 0) {
    const matched = matchAllowedValue(field, clean);
    if (matched && matched !== value) {
      candidates.push({
        label: `Use ${matched}`,
        describe: (v) => `Replace with the AAMVA code ${v}`,
        value: matched
      });
    }
  }

  if (field.code === "DAU") {
    const height = normalizeHeight(value);
    if (height && height !== value) {
      candidates.push({
        label: "Reformat",
        describe: (v) => `Rewrite the height as ${v}`,
        value: height,
        canonical: true
      });
    }
  }

  if (field.type === "zip") {
    const zip = normalizeZip(clean);
    if (zip && zip !== value) {
      candidates.push({
        label: "Reformat",
        describe: (v) => `Keep the digits only: ${v}`,
        value: zip,
        // The encoder strips the dash and space-pads DAK to 11 anyway.
        canonical: true
      });
    }
  }

  const upper = clean.toUpperCase();
  if (upper !== value && field.type !== "date") {
    candidates.push({
      label: clean === value ? "Uppercase" : "Clean up",
      describe: (v) => `Replace with ${v}`,
      value: upper,
      // The printable-ASCII gate above makes case conversion lossless.
      canonical: true
    });
  }

  return candidates;
}

/** First candidate that differs from the input and passes validation. */
function firstPassingCandidate(
  field: AAMVAField,
  value: string,
  stateCode: string | undefined,
  strictMode: boolean,
  canonicalOnly: boolean
): QuickFix | null {
  for (const candidate of buildCandidates(field, value)) {
    if (candidate.value === value) continue;
    if (canonicalOnly && !candidate.canonical) continue;
    const evaluated = evaluateFieldValue(field, candidate.value, stateCode, strictMode);
    if (!evaluated.ok || evaluated.severity === "warning") continue;
    return {
      code: field.code,
      label: candidate.label,
      description: candidate.describe(candidate.value),
      value: candidate.value
    };
  }
  return null;
}

/**
 * The single best repair for a field that currently fails validation, or null
 * when there isn't one that both changes the value and passes.
 */
export function getQuickFix(
  field: AAMVAField,
  value: string,
  stateCode?: string,
  strictMode = false
): QuickFix | null {
  // Nothing to repair without input — an empty required field needs a value,
  // not a rewrite, and inventing one is exactly what this must not do.
  if (!value.trim()) return null;

  const current = evaluateFieldValue(field, value, stateCode, strictMode);
  if (current.ok && current.severity !== "warning") return null;

  return firstPassingCandidate(field, value, stateCode, strictMode, false);
}

/**
 * For a value that already validates but is not what the encoder will write —
 * `5'9"` instead of `069 IN`, `90001-1234` instead of `900011234`, a name still
 * in title case. Returns null when the stored value is already canonical, or
 * when the value is outright invalid (that is `getQuickFix`'s job).
 */
export function getCanonicalRewrite(
  field: AAMVAField,
  value: string,
  stateCode?: string,
  strictMode = false
): QuickFix | null {
  if (!value.trim()) return null;

  const current = evaluateFieldValue(field, value, stateCode, strictMode);
  if (!current.ok) return null;

  return firstPassingCandidate(field, value, stateCode, strictMode, true);
}

/**
 * Every available rewrite across a schema — repairs first, then canonical
 * tidy-ups. This is what "Fix all" applies.
 */
export function getQuickFixes(
  fields: AAMVAField[],
  values: Record<string, string>,
  stateCode?: string,
  strictMode = false
): QuickFix[] {
  const fixes: QuickFix[] = [];
  for (const field of fields) {
    const value = values[field.code] ?? "";
    const fix =
      getQuickFix(field, value, stateCode, strictMode) ??
      getCanonicalRewrite(field, value, stateCode, strictMode);
    if (fix) fixes.push(fix);
  }
  return fixes;
}
