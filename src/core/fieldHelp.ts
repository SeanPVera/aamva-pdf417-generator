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
    "REAL ID / Compliance Type (DDA) is one character on the barcode. " +
    "F — Fully Compliant — this is a REAL ID. TSA and federal facilities accept it for domestic air travel and building access. " +
    "N — Non-Compliant — not a REAL ID. Valid as a state DL/ID, but typically marked FEDERAL LIMITS APPLY on the face, and not accepted at TSA or federal buildings after enforcement. " +
    "Encode F or N; do not write the words.",
  DDE: "Family Name Truncation — T = truncated to fit, N = not truncated, U = unknown.",
  DDF: "First Name Truncation — T = truncated to fit, N = not truncated, U = unknown.",
  DDG: "Middle Name Truncation — T = truncated to fit, N = not truncated, U = unknown.",
  DBC:
    "Sex (DBC) is the AAMVA sex of record on the barcode — not a gender-identity field. " +
    "Version 03 and later encode digits: 1 = male, 2 = female, 9 = not specified " +
    "(the jurisdiction did not encode male or female; 9 is not a third sex). " +
    "Version 01 (2000) predates that scheme and uses M / F instead. " +
    "A reader that expects 1/2/9 will reject M/F on a v10 card.",
  DCG: "Country Identification — three-letter code; almost always USA for US credentials.",
  DCL:
    "Race / Ethnicity — optional on most jurisdictions and excluded entirely on " +
    "many states (NY, CT, VT, ME, NH, and others).",
  DAY:
    "Eye Color (DAY) is a three-letter AAMVA code, not the English word. " +
    "BLK black, BLU blue, BRO brown, GRY gray, GRN green, HAZ hazel, " +
    "MAR maroon, PNK pink, DIC dichromatic (two different colors), UNK unknown. " +
    "Required on version 02 and later — pick UNK if it was not recorded.",
  DAZ:
    "Hair Color (DAZ) is a three-letter AAMVA code, not the English word. " +
    "BAL bald, BLK black, BLN blond, BRO brown, GRY gray, RED red/auburn, " +
    "SDY sandy, WHI white, UNK unknown. Optional — omit it if the jurisdiction does not encode it.",
  DAU:
    "Height — encoded as a 3-digit number followed by a unit, e.g. 069 IN " +
    "(5'9\") or 175 CM. Pick a chip or type it.",
  DAW: "Weight in pounds, zero-padded to three digits, e.g. 180. Pick a chip or type it.",
  DAX: "Weight in kilograms, zero-padded to three digits.",
  DCA:
    "Vehicle Class — the licensee's class designation. A and B are CDL " +
    "(combination / heavy single). C, D, and E are the regular automobile class, " +
    "depending on the state (CA uses C, TX uses D, NY/FL often E). M is motorcycle. " +
    "Combine as AM, DM, etc. ID cards use NONE. Pick a chip or type the jurisdiction's code.",
  DCB:
    "Restriction Codes (DCB) use AAMVA D20 letters, not the numbers some states print on the face. " +
    "B lenses, C mechanical, D prosthetic, E automatic, F outside mirror, G daylight, " +
    "K intrastate, L/Z air brake, T ignition interlock, NONE if none apply. " +
    "Codes can stack; type a combination if a chip is only one letter.",
  DCD:
    "Endorsement Codes — H hazmat, N tank, P passenger, S school bus, T doubles, X tank+hazmat. " +
    "Use NONE if none apply.",
  DCU: "Name Suffix — JR, SR, I, II, III, IV, V. Optional; omit if the name has no suffix.",
  DBA: "Expiration Date — must be after the issue date and within the state's max validity window.",
  DBB: "Date of Birth — used for age-at-issuance checks (must be ≥14 at issuance).",
  DBD: "Document Issue Date — the date this physical card was issued.",
  DDK: "Organ Donor Indicator — 1 = donor, 0 = not a donor.",
  DDL: "Veteran Indicator — 1 = veteran, 0 = not a veteran.",
  DDM:
    "CDL Indicator — CDS 2025. Encode 1 if this credential is a Commercial " +
    "Driver's License or Commercial Learner's Permit; leave blank otherwise. " +
    "The barcode does not carry a 0.",
  DDN:
    "Non-Domiciled Indicator — CDS 2025. Encode 1 if the CDL/CLP holder is " +
    "non-domiciled in the issuing jurisdiction; leave blank otherwise.",
  DDO:
    "Enhanced Credential Indicator — CDS 2025. Encode 1 if this is an Enhanced " +
    "Driver's License or Enhanced Identification Card (EDL/EID); leave blank otherwise.",
  DDP:
    "Permit Indicator — CDS 2025. Encode 1 if this credential is a permit " +
    "(original, motorcycle, commercial, etc.); leave blank otherwise.",
  DCK:
    "Inventory Control Number — the issuer's own stock/production reference for " +
    "the physical card. Optional, but real cards carry it (Connecticut builds " +
    "it from the licence number, the state code, and a batch suffix).",
  ZCA:
    "Connecticut jurisdiction subfile, optional field A. AAMVA reserves Z* " +
    "subfiles for the issuer and defines nothing inside them, so this has no " +
    "standard meaning — leave it blank unless you are reproducing a specific card.",
  ZCB:
    "Connecticut jurisdiction subfile, optional field B. Observed on an issued " +
    "card as a 10-digit number. Filling either ZC field adds a second subfile " +
    "to the barcode, which is what real Connecticut credentials carry."
};

export function getFieldHelp(code: string): string | undefined {
  return FIELD_HELP[code];
}
