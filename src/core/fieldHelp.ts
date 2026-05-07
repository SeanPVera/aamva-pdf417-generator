/**
 * Inline help text shown in a popover next to selected field labels. Only
 * fields whose meaning isn't obvious from the label have entries here — the
 * goal is to help, not to repeat what the input already shows.
 */
export const FIELD_HELP: Record<string, string> = {
  DCF:
    "Document Discriminator — a per-card unique ID printed on the credential. " +
    "Use the Gen button to produce a state-correct value automatically.",
  DAQ:
    "Customer ID Number — the driver license / ID number itself. The Gen button " +
    "produces a value that matches the selected state's pattern.",
  DDB:
    "Card Revision Date — the date the physical card design was last updated. " +
    "The Gen button infers this from the issue date and the state's known era ranges.",
  DDA:
    "Compliance Type — F means a REAL ID (federally compliant); N means " +
    "non-compliant (cannot be used for federal access purposes after enforcement).",
  DDE: "Family Name Truncation — T = truncated to fit, N = not truncated, U = unknown.",
  DDF: "First Name Truncation — T = truncated to fit, N = not truncated, U = unknown.",
  DDG: "Middle Name Truncation — T = truncated to fit, N = not truncated, U = unknown.",
  DCG: "Country Identification — three-letter code; almost always USA for US credentials.",
  DCL:
    "Race / Ethnicity — optional on most jurisdictions and excluded entirely on " +
    "many states (NY, CT, VT, ME, NH, and others).",
  DAU:
    "Height — encoded as a 3-digit number followed by a unit, e.g. 069 IN " + "(5'9\") or 175 CM.",
  DAW: "Weight in pounds, zero-padded to three digits, e.g. 180.",
  DAX: "Weight in kilograms, zero-padded to three digits.",
  DCA: "Vehicle Class — the licensee's class designation (e.g. C, A, M).",
  DCB: 'Restriction Codes — use the "None" button if no restrictions apply.',
  DCD: 'Endorsement Codes — use the "None" button if no endorsements apply.',
  DBA: "Expiration Date — must be after the issue date and within the state's max validity window.",
  DBB: "Date of Birth — used for age-at-issuance checks (must be ≥14 at issuance).",
  DBD: "Document Issue Date — the date this physical card was issued.",
  DDK: "Organ Donor Indicator — 1 = donor, 0 = not a donor.",
  DDL: "Veteran Indicator — 1 = veteran, 0 = not a veteran."
};

export function getFieldHelp(code: string): string | undefined {
  return FIELD_HELP[code];
}
