// Per-jurisdiction rule packs: layered overrides on top of the AAMVA
// version defaults captured in `schema.ts`. Each pack documents legal or
// operational quirks for a single state/territory: extra mandatory fields,
// regex constraints with severity, license validity windows, and per-class
// minimum issuance ages. The packs are pure data — consumed by
// `validation.ts` to surface field-level and cross-field issues.

export type Severity = "error" | "warning" | "info";

export interface JurisdictionConstraint {
  /** AAMVA field code (e.g. "DAQ"). */
  field: string;
  /** Regex the value must match. Empty values are ignored — required-ness
   *  is handled separately via `additionalRequiredFields`. */
  pattern?: RegExp;
  /** Human-readable constraint description shown in the validation report. */
  message: string;
  /** Whether failure to satisfy is a hard error or an advisory warning. */
  severity: Severity;
}

export interface JurisdictionDateRules {
  /** Maximum validity period (DBA - DBD) in years for a regular DL. */
  maxValidityYears?: number;
  /** Minimum validity period in years (catches obviously short windows). */
  minValidityYears?: number;
  /** Minimum age in years required for a regular DL at issuance. */
  minIssuanceAge?: number;
  /** Minimum age in years required for a learner permit / junior class. */
  minLearnerAge?: number;
}

/**
 * One data element of a jurisdiction-specific subfile.
 *
 * These are not AAMVA data elements: the standard reserves subfile types
 * beginning with `Z` for the issuing jurisdiction and says nothing about what
 * goes in them, so the codes and meanings are per-jurisdiction and only
 * discoverable from cards a DMV actually issues.
 */
export interface JurisdictionSubfileElement {
  /** Three-character element identifier as it appears on the wire (e.g. "ZCB"). */
  code: string;
  /** Label shown in the form. */
  label: string;
  /** Maximum characters, where the observed format implies one. */
  maxLength?: number;
}

/**
 * A jurisdiction-specific subfile carried alongside the DL/ID subfile.
 *
 * `type` is the two-character designator written into the header directory.
 */
export interface JurisdictionSubfileProfile {
  type: string;
  elements: JurisdictionSubfileElement[];
  /** Where the shape was observed. Keeps guesses distinguishable from evidence. */
  source: string;
}

/**
 * How a jurisdiction's encoder actually lays out the wire format, as opposed to
 * how the AAMVA spec describes it. Every entry here should be traceable to a
 * decoded card — the defaults in `schema.ts` and `generator.ts` are the spec
 * reading, and this is where an observed deviation from it gets recorded.
 */
export interface JurisdictionEncodingProfile {
  /**
   * Two-digit Jurisdiction Version Number written into the header. It counts
   * the issuer's own revisions of its implementation, independently of the
   * AAMVA version beside it, so it is only knowable from a card. Defaults to
   * "00", which is what an issuer that has never revised would emit — and what
   * this app emitted for everyone before any card was decoded.
   */
  jurisdictionVersion?: string;
  /**
   * Element order within the DL/ID subfile. AAMVA does not mandate one, so the
   * generator defaults to schema order; a jurisdiction that is known to emit a
   * different order lists it here. Codes absent from the list keep schema order
   * and follow the listed ones.
   */
  elementOrder?: string[];
  /**
   * Whether DAK is space-filled to its fixed 11-character width. The spec
   * defines the field as fixed-width, and that is the default, but issuers are
   * observed emitting the bare 9-digit ZIP+4.
   */
  padPostalCode?: boolean;
  /**
   * Widths an issuer space-fills its values to, where those are its own rather
   * than the spec's. New York pads ten fields, and only four of the widths are
   * the AAMVA ones — it writes the name fields to 25 where the spec allows 40,
   * and the vehicle class to 4 where the spec allows 6.
   *
   * Only record a width read off a card. A value already at or over its width
   * is written unchanged, so this can never truncate.
   */
  fieldWidths?: Record<string, number>;
  /**
   * Whether the last element of a subfile is closed by the segment terminator
   * alone, with no data element separator before it. The spec's own example
   * separates every element and then terminates, which is the default; New York
   * drops that final separator, making each of its subfiles one byte shorter.
   */
  omitFinalSeparator?: boolean;
  /** Jurisdiction-specific subfile emitted after the DL/ID subfile. */
  jurisdictionSubfile?: JurisdictionSubfileProfile;
  /** Where the profile came from. */
  source?: string;
}

export interface JurisdictionRulePack {
  state: string;
  /** Field codes the jurisdiction additionally treats as mandatory. */
  additionalRequiredFields?: string[];
  /** Field codes that are strongly recommended; missing values warn. */
  recommendedFields?: string[];
  /** Field-level format/value constraints. */
  constraints?: JurisdictionConstraint[];
  /** Date semantics governing issue/expiry windows and minimum age. */
  dateRules?: JurisdictionDateRules;
  /** DCA vehicle-class code → minimum age (years) at issuance. */
  classMinimumAges?: Record<string, number>;
  /** Observed wire-format deviations from the spec defaults. */
  encoding?: JurisdictionEncodingProfile;
  /** Free-form description shown in tooling. */
  description?: string;
}

const DEFAULT_DATE_RULES: JurisdictionDateRules = {
  // Most U.S. jurisdictions cap regular DL validity at 8 years; a longer
  // window catches obvious data-entry mistakes without false positives for
  // the few outliers (AZ).
  maxValidityYears: 8,
  minIssuanceAge: 14
};

// Standard CDL minimum ages (federal interstate rule for Class A/B is 21).
// We treat 21 as the safe default and let states override where their
// intrastate rules differ. Class M (motorcycle) and Class C/D (regular)
// are state-specific; if omitted, the cross-field validator silently
// skips the class-age check.
const COMMON_CDL_MIN_AGES: Record<string, number> = { A: 21, B: 21 };

// Rule packs: encode well-documented state quirks. Format-strict DAQ
// patterns for CA/FL/NY/TX use severity "error" because they are already
// enforced by `AAMVA_STATE_RULES.validators` and any deviation is a hard
// failure. For other states the published format documents have enough
// real-world variation that we report them as warnings only — users with
// an unusual but legitimate license number get a heads-up rather than a
// blocking error.
export const JURISDICTION_RULE_PACKS: Record<string, JurisdictionRulePack> = {
  AL: {
    state: "AL",
    description: "Alabama — 4-year DL term; DAQ is 1–8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,8}$/,
        message: "Alabama DL number is typically 1–8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 14 }
  },
  AK: {
    state: "AK",
    description: "Alaska — 5-year DL term; DAQ is 7 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{7}$/,
        message: "Alaska DL number is typically 7 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 14 }
  },
  AZ: {
    state: "AZ",
    description: "Arizona — DL valid until age 65; DAQ is 1 letter + 8 digits or 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{8}|[0-9]{9})$/,
        message: "Arizona DL number is typically 1 letter + 8 digits or 9 digits.",
        severity: "warning"
      }
    ],
    // AZ issues licenses good until age 65; allow up to ~50 years to avoid
    // false-positive validity warnings.
    dateRules: { maxValidityYears: 50, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, G: 16, M: 16 }
  },
  AR: {
    state: "AR",
    description: "Arkansas — 4 or 8-year DL term; DAQ is 4–9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{4,9}$/,
        message: "Arkansas DL number is typically 4–9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  CA: {
    state: "CA",
    description: "California — 5-year DL term; DAQ is 1 letter + 7 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{7}$/,
        message: "California DL number must be 1 letter followed by 7 digits.",
        severity: "error"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { A: 21, B: 21, C: 16, M: 16, M1: 16, M2: 16 }
  },
  CO: {
    state: "CO",
    description: "Colorado — 5-year DL term; DAQ is 9 digits or 1 letter + 3–6 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([0-9]{9}|[A-Z][0-9]{3,6})$/,
        message: "Colorado DL number is typically 9 digits or 1 letter + 3–6 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, R: 16, M: 16 }
  },
  CT: {
    state: "CT",
    description:
      "Connecticut — 6-year DL term; DAQ is 9 digits. Encoding profile taken from an issued card.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{9}$/,
        message: "Connecticut DL number is typically 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 },
    // Read off a decoded Connecticut credential (AAMVA v09, IIN 636006). Three
    // things there differ from the spec-default encoding this app used to emit
    // for every jurisdiction, and all three are visible in the raw bytes:
    // the element order, an unpadded DAK, and a second `ZC` subfile — which the
    // header declares as two directory entries, not one.
    encoding: {
      source: "Decoded Connecticut DL barcode (AAMVA v09, IIN 636006), captured 2026-08-17",
      padPostalCode: false,
      elementOrder: [
        "DAQ",
        "DCS",
        "DDE",
        "DAC",
        "DDF",
        "DAD",
        "DDG",
        "DCA",
        "DCB",
        "DCD",
        "DBD",
        "DBB",
        "DBA",
        "DBC",
        "DAU",
        "DAY",
        "DAG",
        "DAI",
        "DAJ",
        "DAK",
        "DCF",
        "DCG",
        "DCK",
        "DDA",
        "DDB"
      ],
      jurisdictionSubfile: {
        type: "ZC",
        source: "Decoded Connecticut DL barcode (AAMVA v09, IIN 636006), captured 2026-08-17",
        // The card carried ZCA empty and ZCB as a 10-digit number. AAMVA leaves
        // `Z`-prefixed subfiles entirely to the jurisdiction, so neither
        // element has a documented meaning to label them by — naming them for
        // what they are (optional, jurisdiction-defined) is the honest option.
        elements: [
          { code: "ZCA", label: "CT Optional Field A", maxLength: 25 },
          { code: "ZCB", label: "CT Optional Field B", maxLength: 25 }
        ]
      }
    }
  },
  DE: {
    state: "DE",
    description: "Delaware — 8-year DL term; DAQ is 1–7 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,7}$/,
        message: "Delaware DL number is typically 1–7 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  DC: {
    state: "DC",
    description: "District of Columbia — 8-year DL term; DAQ is 7 or 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([0-9]{7}|[0-9]{9})$/,
        message: "DC DL number is typically 7 or 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  FL: {
    state: "FL",
    description: "Florida — 8-year DL term; DAQ is 1 letter + 12 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{12}$/,
        message: "Florida DL number must be 1 letter followed by 12 digits.",
        severity: "error"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { E: 16, A: 21, B: 21, M: 16 }
  },
  GA: {
    state: "GA",
    description: "Georgia — 8-year DL term; DAQ is 7–9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{7,9}$/,
        message: "Georgia DL number is typically 7–9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 17 }
  },
  HI: {
    state: "HI",
    description: "Hawaii — 8-year DL term; DAQ is 9 digits or 1 letter + 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{8}|[0-9]{9})$/,
        message: "Hawaii DL number is typically 9 digits or 1 letter + 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, "3": 16, M: 16 }
  },
  ID: {
    state: "ID",
    description: "Idaho — 4 or 8-year DL term; DAQ is 9 chars (2L + 6 digits + 1L) or 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z]{2}[0-9]{6}[A-Z]|[0-9]{9})$/,
        message: "Idaho DL number is typically 2 letters + 6 digits + 1 letter, or 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 15 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 15, M: 15 }
  },
  IL: {
    state: "IL",
    description: "Illinois — 4-year DL term; DAQ is 1 letter + 11 or 12 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{11,12}$/,
        message: "Illinois DL number is typically 1 letter followed by 11 or 12 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { D: 18, A: 21, B: 21, M: 16 }
  },
  IN: {
    state: "IN",
    description: "Indiana — 6-year DL term; DAQ is 10 digits or 1 letter + 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([0-9]{10}|[A-Z][0-9]{9})$/,
        message: "Indiana DL number is typically 10 digits or 1 letter + 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  IA: {
    state: "IA",
    description: "Iowa — 5 or 8-year DL term; DAQ is 9 alphanumeric characters.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z0-9]{9}$/,
        message: "Iowa DL number is typically 9 alphanumeric characters.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 17, D: 16, M: 14 }
  },
  KS: {
    state: "KS",
    description: "Kansas — 6-year DL term; DAQ is 9 digits or 1 letter + 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{8}|[0-9]{9})$/,
        message: "Kansas DL number is typically 9 digits or 1 letter + 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  KY: {
    state: "KY",
    description: "Kentucky — 4 or 8-year DL term; DAQ is 9 digits or 1 letter + 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{8}|[0-9]{9})$/,
        message: "Kentucky DL number is typically 9 digits or 1 letter + 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 18 }
  },
  LA: {
    state: "LA",
    description: "Louisiana — 6-year DL term; DAQ is up to 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,9}$/,
        message: "Louisiana DL number is typically up to 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, E: 16, M: 17 }
  },
  ME: {
    state: "ME",
    description: "Maine — 6-year DL term; DAQ is 7 digits, optionally followed by 'Y'.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{7}Y?$/,
        message: "Maine DL number is typically 7 digits, optionally with a trailing 'Y'.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  MD: {
    state: "MD",
    description: "Maryland — 8-year DL term; DAQ is 1 letter + 12 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{12}$/,
        message: "Maryland DL number is typically 1 letter followed by 12 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  MA: {
    state: "MA",
    description: "Massachusetts — 5-year DL term; DAQ is 9 digits or 1 letter + 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{8}|[0-9]{9})$/,
        message: "Massachusetts DL number is typically 9 digits or 1 letter + 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  MI: {
    state: "MI",
    description: "Michigan — 4-year DL term; DAQ is 1 letter + 12 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{12}$/,
        message: "Michigan DL number is typically 1 letter followed by 12 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, Operator: 16, M: 16 }
  },
  MN: {
    state: "MN",
    description: "Minnesota — 4-year DL term; DAQ is 1 letter + 12 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{12}$/,
        message: "Minnesota DL number is typically 1 letter followed by 12 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  MS: {
    state: "MS",
    description: "Mississippi — 4 or 8-year DL term; DAQ is 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{9}$/,
        message: "Mississippi DL number is typically 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 15 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, R: 15, M: 16 }
  },
  MO: {
    state: "MO",
    description: "Missouri — 6-year DL term; DAQ is 1 letter + 5–9 digits or 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{5,9}|[0-9]{8,9})$/,
        message: "Missouri DL number is typically 1 letter + 5–9 digits, or 8–9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, F: 16, M: 16 }
  },
  MT: {
    state: "MT",
    description: "Montana — 4, 8, or 12-year DL term; DAQ is 9 digits or 13 alphanumerics.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([0-9]{9}|[A-Z0-9]{13,14})$/,
        message: "Montana DL number is typically 9 digits or 13–14 alphanumerics.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 12, minIssuanceAge: 15 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 15, M: 15 }
  },
  NE: {
    state: "NE",
    description: "Nebraska — 5-year DL term; DAQ is 1 letter + 6–8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{6,8}$/,
        message: "Nebraska DL number is typically 1 letter followed by 6–8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, O: 16, M: 16 }
  },
  NV: {
    state: "NV",
    description: "Nevada — 8-year DL term; DAQ is 9–12 digits or 'X' + 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([0-9]{9,12}|X[0-9]{8})$/,
        message: "Nevada DL number is typically 9–12 digits or 'X' + 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  NH: {
    state: "NH",
    description: "New Hampshire — 5-year DL term; DAQ is 2 digits + 3 letters + 5 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{2}[A-Z]{3}[0-9]{5}$/,
        message: "New Hampshire DL number is 2 digits + 3 letters + 5 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  NJ: {
    state: "NJ",
    description: "New Jersey — 4-year DL term; DAQ is 1 letter + 14 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{14}$/,
        message: "New Jersey DL number is typically 1 letter + 14 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 17 },
    classMinimumAges: { D: 17, A: 21, B: 21, M: 17 }
  },
  NM: {
    state: "NM",
    description: "New Mexico — 4 or 8-year DL term; DAQ is 8 or 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{8,9}$/,
        message: "New Mexico DL number is typically 8 or 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 15 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 15, M: 15 }
  },
  NY: {
    state: "NY",
    // Read off a decoded New York credential (AAMVA v10, IIN 636001). It agrees
    // with the schema's default element order, which is why no `elementOrder` is
    // recorded here — the default was right and is now confirmed rather than
    // assumed. What it does not agree with is the jurisdiction version, which
    // this app hardcoded to "00" for every issuer.
    encoding: {
      source: "Decoded New York DL barcode (AAMVA v10, IIN 636001), captured 2026-08-17",
      jurisdictionVersion: "04",
      omitFinalSeparator: true,
      // Measured from the card's own bytes with the wire ledger: 100 bytes of
      // space fill across ten elements. Only four widths are the AAMVA ones
      // (DCD, DAU, DAI, DAK); the rest are New York's own, which is why testing
      // the byte gap against spec widths alone could never account for it.
      fieldWidths: {
        DCA: 4,
        DCB: 10,
        DCD: 5,
        DCS: 25,
        DAC: 25,
        DAD: 25,
        DAU: 6,
        DAG: 25,
        DAI: 20,
        DAK: 11,
        ZNA: 20
      },
      jurisdictionSubfile: {
        type: "ZN",
        source: "Decoded New York DL barcode (AAMVA v10, IIN 636001), captured 2026-08-17",
        // ZNA holds the cardholder's name re-encoded with "@" separators,
        // space-filled to 20; ZNB an opaque 90-character blob of mixed-case
        // printable ASCII. Neither has a published meaning — AAMVA reserves Z*
        // subfiles to the issuer.
        elements: [
          { code: "ZNA", label: "NY Optional Field A", maxLength: 50 },
          { code: "ZNB", label: "NY Optional Field B", maxLength: 120 }
        ]
      }
    },
    description: "New York — 8-year DL term; DAQ is exactly 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{9}$/,
        message: "New York DL number must be exactly 9 digits.",
        severity: "error"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16, minLearnerAge: 16 },
    classMinimumAges: { A: 21, B: 21, C: 18, D: 18, DJ: 16, M: 18, MJ: 16 }
  },
  NC: {
    state: "NC",
    description: "North Carolina — 8-year DL term; DAQ is 1–12 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,12}$/,
        message: "North Carolina DL number is typically 1–12 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  ND: {
    state: "ND",
    description: "North Dakota — 4 or 6-year DL term; DAQ is 3 letters + 6 digits or 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z]{3}[0-9]{6}|[0-9]{9})$/,
        message: "North Dakota DL number is typically 3 letters + 6 digits, or 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 14 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 14, M: 14 }
  },
  OH: {
    state: "OH",
    description: "Ohio — 4 or 8-year DL term; DAQ is 2 letters + 6 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z]{2}[0-9]{6}$/,
        message: "Ohio DL number is typically 2 letters followed by 6 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  OK: {
    state: "OK",
    description: "Oklahoma — 4 or 8-year DL term; DAQ is 9 digits, with optional 1-letter prefix.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{9}|[0-9]{9})$/,
        message: "Oklahoma DL number is typically 9 digits, optionally prefixed by a letter.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  OR: {
    state: "OR",
    description: "Oregon — 8-year DL term; DAQ is 1–9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,9}$/,
        message: "Oregon DL number is typically 1–9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  PA: {
    state: "PA",
    description: "Pennsylvania — 4-year DL term; DAQ is 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{8}$/,
        message: "Pennsylvania DL number is typically 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },
  RI: {
    state: "RI",
    description: "Rhode Island — 5-year DL term; DAQ is 7 digits or 'V' + 6 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^(V[0-9]{6}|[0-9]{7})$/,
        message: "Rhode Island DL number is typically 7 digits or 'V' + 6 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  SC: {
    state: "SC",
    description: "South Carolina — 8-year DL term; DAQ is 5–11 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{5,11}$/,
        message: "South Carolina DL number is typically 5–11 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 15 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 15, M: 15 }
  },
  SD: {
    state: "SD",
    description: "South Dakota — 5-year DL term; DAQ is 6–10 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{6,10}$/,
        message: "South Dakota DL number is typically 6–10 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 14 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 14, M: 14 }
  },
  TN: {
    state: "TN",
    description: "Tennessee — 8-year DL term; DAQ is 7–9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{7,9}$/,
        message: "Tennessee DL number is typically 7–9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 15 }
  },
  TX: {
    state: "TX",
    description: "Texas — 8-year DL term; DAQ is exactly 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{8}$/,
        message: "Texas DL number must be exactly 8 digits.",
        severity: "error"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { A: 21, B: 21, C: 16, M: 15 }
  },
  UT: {
    state: "UT",
    description: "Utah — 5 or 8-year DL term; DAQ is 4–10 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{4,10}$/,
        message: "Utah DL number is typically 4–10 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  VT: {
    state: "VT",
    description: "Vermont — 4-year DL term; DAQ is 8 digits or 7 digits + 'A'.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([0-9]{8}|[0-9]{7}A)$/,
        message: "Vermont DL number is typically 8 digits or 7 digits + 'A'.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  VA: {
    state: "VA",
    description: "Virginia — 8-year DL term; DAQ is 9 digits or 1 letter + 8 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{8}|[0-9]{9})$/,
        message: "Virginia DL number is typically 9 digits or 1 letter + 8 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  WA: {
    state: "WA",
    description: "Washington — 6-year DL term; DAQ is up to 12 alphanumerics (mostly letters).",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z*][A-Z0-9*]{4,11}$/,
        message: "Washington DL number is typically up to 12 alphanumeric characters.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { A: 21, B: 21, C: 21, D: 16, M: 16 }
  },
  WV: {
    state: "WV",
    description: "West Virginia — 5 or 8-year DL term; DAQ is 1 letter + 6 digits or 7 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^([A-Z][0-9]{6}|[0-9]{7})$/,
        message: "West Virginia DL number is typically 1 letter + 6 digits, or 7 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, E: 16, M: 16 }
  },
  WI: {
    state: "WI",
    description: "Wisconsin — 8-year DL term; DAQ is 1 letter + 13 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[A-Z][0-9]{13}$/,
        message: "Wisconsin DL number is typically 1 letter followed by 13 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  WY: {
    state: "WY",
    description: "Wyoming — 4-year DL term; DAQ is 9–10 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{9,10}$/,
        message: "Wyoming DL number is typically 9–10 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, C: 16, M: 16 }
  },

  // U.S. territories — most follow the AAMVA defaults; rule shapes mirror
  // the mainland states so consumers can rely on a uniform schema.
  AS: {
    state: "AS",
    description: "American Samoa — 4-year DL term; DAQ is 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,9}$/,
        message: "American Samoa DL number is typically up to 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  GU: {
    state: "GU",
    description: "Guam — 5-year DL term; DAQ is up to 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,9}$/,
        message: "Guam DL number is typically up to 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  VI: {
    state: "VI",
    description: "U.S. Virgin Islands — 5-year DL term; DAQ is up to 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,9}$/,
        message: "U.S. Virgin Islands DL number is typically up to 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  },
  PR: {
    state: "PR",
    description: "Puerto Rico — 6-year DL term; DAQ is up to 9 digits.",
    constraints: [
      {
        field: "DAQ",
        pattern: /^[0-9]{1,9}$/,
        message: "Puerto Rico DL number is typically up to 9 digits.",
        severity: "warning"
      }
    ],
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { ...COMMON_CDL_MIN_AGES, D: 16, M: 16 }
  }
};

/** Returns the rule pack for `stateCode`, or a default pack if absent. */
export function getJurisdictionRulePack(stateCode: string): JurisdictionRulePack {
  const explicit = JURISDICTION_RULE_PACKS[stateCode];
  if (explicit) return explicit;
  return { state: stateCode, dateRules: DEFAULT_DATE_RULES };
}

/** Resolves date rules for `stateCode`, falling back to global defaults. */
export function getEffectiveDateRules(stateCode: string): JurisdictionDateRules {
  const pack = JURISDICTION_RULE_PACKS[stateCode];
  return { ...DEFAULT_DATE_RULES, ...(pack?.dateRules ?? {}) };
}

/** Returns the global default date rules. */
export function getDefaultDateRules(): JurisdictionDateRules {
  return { ...DEFAULT_DATE_RULES };
}

/**
 * Observed encoding profile for `stateCode`, or `undefined` when nobody has
 * decoded a card from that jurisdiction yet.
 *
 * Absence is meaningful: it means the generator falls back to the spec reading,
 * not that the spec reading has been confirmed against a real credential.
 */
export function getJurisdictionEncoding(
  stateCode: string
): JurisdictionEncodingProfile | undefined {
  return JURISDICTION_RULE_PACKS[stateCode]?.encoding;
}

/** Jurisdiction-specific subfile elements for `stateCode` (empty when none). */
export function getJurisdictionSubfileElements(stateCode: string): JurisdictionSubfileElement[] {
  return JURISDICTION_RULE_PACKS[stateCode]?.encoding?.jurisdictionSubfile?.elements ?? [];
}

/** True when DAK should be space-filled to its fixed 11-character width. */
export function shouldPadPostalCode(stateCode: string): boolean {
  return JURISDICTION_RULE_PACKS[stateCode]?.encoding?.padPostalCode !== false;
}
