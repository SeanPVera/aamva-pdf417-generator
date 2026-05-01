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

// Rule packs: only encode quirks that are well-documented and stable.
// Anything debatable should be a warning, not an error.
export const JURISDICTION_RULE_PACKS: Record<string, JurisdictionRulePack> = {
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
  NY: {
    state: "NY",
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
  IL: {
    state: "IL",
    description: "Illinois — 4-year DL term.",
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 },
    classMinimumAges: { D: 18, A: 21, B: 21, M: 16 }
  },
  WA: {
    state: "WA",
    description: "Washington — 6-year DL term.",
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 },
    classMinimumAges: { A: 21, B: 21, C: 21 }
  },
  PA: {
    state: "PA",
    description: "Pennsylvania — 4-year DL term.",
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 }
  },
  OH: {
    state: "OH",
    description: "Ohio — 4-year DL term.",
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 }
  },
  MI: {
    state: "MI",
    description: "Michigan — 4-year DL term.",
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 }
  },
  NJ: {
    state: "NJ",
    description: "New Jersey — 4-year DL term; minimum issuance age 17.",
    dateRules: { maxValidityYears: 4, minIssuanceAge: 17 },
    classMinimumAges: { D: 17, A: 21, B: 21, M: 17 }
  },
  AZ: {
    state: "AZ",
    description: "Arizona — DL valid until age 65 (long term); min age 16.",
    // AZ issues licenses good until age 65; allow up to ~50 years to avoid
    // false-positive validity warnings.
    dateRules: { maxValidityYears: 50, minIssuanceAge: 16 }
  },
  GA: {
    state: "GA",
    description: "Georgia — up to 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  NC: {
    state: "NC",
    description: "North Carolina — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  VA: {
    state: "VA",
    description: "Virginia — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  DC: {
    state: "DC",
    description: "DC — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  MD: {
    state: "MD",
    description: "Maryland — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  CO: {
    state: "CO",
    description: "Colorado — 5-year DL term.",
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 }
  },
  MA: {
    state: "MA",
    description: "Massachusetts — 5-year DL term.",
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 }
  },
  OR: {
    state: "OR",
    description: "Oregon — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  IN: {
    state: "IN",
    description: "Indiana — 6-year DL term.",
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 }
  },
  TN: {
    state: "TN",
    description: "Tennessee — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  MN: {
    state: "MN",
    description: "Minnesota — 4-year DL term.",
    dateRules: { maxValidityYears: 4, minIssuanceAge: 16 }
  },
  MO: {
    state: "MO",
    description: "Missouri — 6-year DL term.",
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 }
  },
  WI: {
    state: "WI",
    description: "Wisconsin — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  CT: {
    state: "CT",
    description: "Connecticut — 6-year DL term.",
    dateRules: { maxValidityYears: 6, minIssuanceAge: 16 }
  },
  NV: {
    state: "NV",
    description: "Nevada — 8-year DL term; min issuance age 16.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  UT: {
    state: "UT",
    description: "Utah — 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  NM: {
    state: "NM",
    description: "New Mexico — 4-year or 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 15 }
  },
  HI: {
    state: "HI",
    description: "Hawaii — up to 8-year DL term.",
    dateRules: { maxValidityYears: 8, minIssuanceAge: 16 }
  },
  AK: {
    state: "AK",
    description: "Alaska — 5-year DL term; min issuance age 16.",
    dateRules: { maxValidityYears: 5, minIssuanceAge: 16 }
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
