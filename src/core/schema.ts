import { getJurisdictionSubfileElements } from "./jurisdictionRules";

export interface FieldOption {
  value: string;
  label: string;
}

export interface AAMVAField {
  code: string;
  label: string;
  type: "string" | "char" | "zip" | "date";
  required?: boolean;
  dateFormat?: string;
  options?: FieldOption[];
  /**
   * Which subfile the element is written to. Omitted means the DL/ID subfile,
   * which is every AAMVA-standard element. `"jurisdiction"` marks an element of
   * a jurisdiction-defined `Z*` subfile, whose codes are not AAMVA data
   * elements and must not be written into the DL/ID subfile.
   */
  subfile?: "jurisdiction";
  /**
   * Per-field length cap for elements outside `AAMVA_FIELD_LIMITS`. Standard
   * codes keep their limit in that table; this exists for jurisdiction-defined
   * elements, whose codes are only meaningful within one jurisdiction.
   */
  maxLength?: number;
}

export interface AAMVAVersionDef {
  name: string;
  fields: AAMVAField[];
}

export type FieldGroupId =
  | "identity"
  | "physical"
  | "address"
  | "license"
  | "privileges"
  | "jurisdiction";

export interface FieldGroupDef {
  id: FieldGroupId;
  label: string;
  description: string;
}

// Display order is the order groups appear in the UI.
export const AAMVA_FIELD_GROUPS: FieldGroupDef[] = [
  {
    id: "identity",
    label: "Identity",
    description: "Names, date of birth, sex, and name truncation indicators."
  },
  {
    id: "address",
    label: "Address",
    description: "Mailing address used on the credential."
  },
  {
    id: "physical",
    label: "Physical Description",
    description: "Height, weight, eye and hair color, race/ethnicity."
  },
  {
    id: "license",
    label: "License Details",
    description: "Document numbers, dates, country, compliance and indicator fields."
  },
  {
    id: "privileges",
    label: "Driving Privileges",
    description: "Vehicle class, restrictions, and endorsements."
  },
  {
    id: "jurisdiction",
    label: "Jurisdiction Subfile",
    description:
      "Elements the issuing jurisdiction defines for itself, written to a separate Z* subfile."
  }
];

// Field code → group. Groups are universal across AAMVA versions.
const FIELD_CODE_TO_GROUP: Record<string, FieldGroupId> = {
  // Identity
  DAA: "identity",
  DCS: "identity",
  DAC: "identity",
  DAD: "identity",
  DCT: "identity",
  DCU: "identity",
  DBB: "identity",
  DBC: "identity",
  DDE: "identity",
  DDF: "identity",
  DDG: "identity",
  // Address
  DAG: "address",
  DAH: "address",
  DAI: "address",
  DAJ: "address",
  DAK: "address",
  // Physical
  DAU: "physical",
  DAW: "physical",
  DAX: "physical",
  DAY: "physical",
  DAZ: "physical",
  DCL: "physical",
  // License Details
  DAQ: "license",
  DCF: "license",
  DCG: "license",
  DCK: "license",
  DBA: "license",
  DBD: "license",
  DDB: "license",
  DDA: "license",
  DDK: "license",
  DDL: "license",
  DDM: "license",
  DDN: "license",
  DDO: "license",
  DDP: "license",
  DDD: "license",
  // Privileges
  DAR: "privileges",
  DAS: "privileges",
  DAT: "privileges",
  DCA: "privileges",
  DCB: "privileges",
  DCD: "privileges"
};

export function getFieldGroup(code: string): FieldGroupId {
  // Jurisdiction-defined subfile elements are Z-prefixed by the AAMVA
  // reservation and never appear in the table above — they belong to one
  // jurisdiction, not to the standard.
  if (code.startsWith("Z")) return "jurisdiction";
  return FIELD_CODE_TO_GROUP[code] || "license";
}

export const AAMVA_FIELD_OPTIONS: Record<string, FieldOption[]> = {
  DBC: [
    { value: "1", label: "1 — Male" },
    { value: "2", label: "2 — Female" },
    { value: "9", label: "9 — Not Specified" }
  ],
  DAY: [
    { value: "BLK", label: "BLK — Black" },
    { value: "BLU", label: "BLU — Blue" },
    { value: "BRO", label: "BRO — Brown" },
    { value: "GRY", label: "GRY — Gray" },
    { value: "GRN", label: "GRN — Green" },
    { value: "HAZ", label: "HAZ — Hazel" },
    { value: "MAR", label: "MAR — Maroon" },
    { value: "PNK", label: "PNK — Pink" },
    { value: "DIC", label: "DIC — Dichromatic" },
    { value: "UNK", label: "UNK — Unknown" }
  ],
  DAZ: [
    { value: "BAL", label: "BAL — Bald" },
    { value: "BLK", label: "BLK — Black" },
    { value: "BLN", label: "BLN — Blond" },
    { value: "BRO", label: "BRO — Brown" },
    { value: "GRY", label: "GRY — Gray" },
    { value: "RED", label: "RED — Red/Auburn" },
    { value: "SDY", label: "SDY — Sandy" },
    { value: "WHI", label: "WHI — White" },
    { value: "UNK", label: "UNK — Unknown" }
  ],
  DCG: [
    { value: "USA", label: "USA — United States" },
    { value: "CAN", label: "CAN — Canada" },
    { value: "MEX", label: "MEX — Mexico" }
  ],
  DDE: [
    { value: "T", label: "T — Truncated" },
    { value: "N", label: "N — Not Truncated" },
    { value: "U", label: "U — Unknown" }
  ],
  DDF: [
    { value: "T", label: "T — Truncated" },
    { value: "N", label: "N — Not Truncated" },
    { value: "U", label: "U — Unknown" }
  ],
  DDG: [
    { value: "T", label: "T — Truncated" },
    { value: "N", label: "N — Not Truncated" },
    { value: "U", label: "U — Unknown" }
  ],
  DDA: [
    { value: "F", label: "F — Fully Compliant" },
    { value: "N", label: "N — Non-Compliant" }
  ],
  DDK: [
    { value: "1", label: "1 — Donor" },
    { value: "0", label: "0 — Not a Donor" }
  ],
  DDL: [
    { value: "1", label: "1 — Veteran" },
    { value: "0", label: "0 — Not a Veteran" }
  ],
  DDD: [
    { value: "1", label: "1 — Limited Duration" },
    { value: "0", label: "0 — Not Limited Duration" }
  ],
  DCL: [
    { value: "AI", label: "AI — Alaskan/American Indian" },
    { value: "AP", label: "AP — Asian/Pacific Islander" },
    { value: "BK", label: "BK — Black" },
    { value: "H", label: "H — Hispanic Origin" },
    { value: "O", label: "O — Non-Hispanic" },
    { value: "U", label: "U — Unknown" },
    { value: "W", label: "W — White" }
  ],
  // CDS 2025 document-type indicators. Each is, in the standard's words,
  // "either absent or has the following value" — so there is one option and
  // omitting the element is the other state.
  DDM: [{ value: "1", label: "1 — CDL or CLP" }],
  DDN: [{ value: "1", label: "1 — Non-domiciled" }],
  DDO: [{ value: "1", label: "1 — Enhanced credential" }],
  DDP: [{ value: "1", label: "1 — Permit" }]
};

export const AAMVA_FIELD_LIMITS: Record<string, number> = {
  DCS: 40,
  DAC: 40,
  DAD: 40,
  DAA: 125,
  DCT: 80,
  DCU: 5,
  DAG: 35,
  DAH: 35,
  DAI: 20,
  DAJ: 2,
  DAK: 11,
  DAQ: 25,
  DCA: 6,
  DCB: 12,
  DCD: 5,
  DBA: 8,
  DBB: 8,
  DBC: 1,
  DBD: 8,
  DAU: 6,
  DAY: 3,
  DAZ: 3,
  DAW: 3,
  DAX: 3,
  DCF: 25,
  DCG: 3,
  DCK: 25,
  DCL: 2,
  DDE: 1,
  DDF: 1,
  DDG: 1,
  DDA: 1,
  DDB: 8,
  DDK: 1,
  DDL: 1,
  DDD: 1,
  DAR: 4,
  DAS: 10,
  DAT: 5,
  DDM: 1,
  DDN: 1,
  DDO: 1,
  DDP: 1
};

export const AAMVA_STATE_EXCLUDED_FIELDS: Record<string, string[]> = {
  NY: ["DAW", "DAX", "DAZ", "DCL"],
  CT: ["DAW", "DAX", "DCL"],
  VT: ["DAW", "DAX", "DCL"],
  ME: ["DAW", "DAX", "DCL"],
  NH: ["DAW", "DAX", "DCL"],
  AL: ["DAX", "DCL"],
  AK: ["DAX", "DCL"],
  AZ: ["DAX", "DCL"],
  AR: ["DAX", "DCL"],
  CA: ["DAX", "DCL"],
  CO: ["DAX", "DCL"],
  DE: ["DAX", "DCL"],
  FL: ["DAX", "DCL"],
  GA: ["DAX", "DCL"],
  HI: ["DAX", "DCL"],
  ID: ["DAX", "DCL"],
  IL: ["DAX", "DCL"],
  IN: ["DAX", "DCL"],
  IA: ["DAX", "DCL"],
  KS: ["DAX", "DCL"],
  KY: ["DAX", "DCL"],
  LA: ["DAX", "DCL"],
  MD: ["DAX", "DCL"],
  MA: ["DAX", "DCL"],
  MI: ["DAX", "DCL"],
  MN: ["DAX", "DCL"],
  MS: ["DAX", "DCL"],
  MO: ["DAX", "DCL"],
  MT: ["DAX", "DCL"],
  NE: ["DAX", "DCL"],
  NV: ["DAX", "DCL"],
  NJ: ["DAX", "DCL"],
  NM: ["DAX", "DCL"],
  NC: ["DAX", "DCL"],
  ND: ["DAX", "DCL"],
  OH: ["DAX", "DCL"],
  OK: ["DAX", "DCL"],
  OR: ["DAX", "DCL"],
  PA: ["DAX", "DCL"],
  RI: ["DAX", "DCL"],
  SC: ["DAX", "DCL"],
  SD: ["DAX", "DCL"],
  TN: ["DAX", "DCL"],
  TX: ["DAX", "DCL"],
  UT: ["DAX", "DCL"],
  VA: ["DAX", "DCL"],
  WA: ["DAX", "DCL"],
  WV: ["DAX", "DCL"],
  WI: ["DAX", "DCL"],
  WY: ["DAX", "DCL"],
  DC: ["DAX", "DCL"]
};

// The 2009 standard's DL subfile data-element set. The 2010, 2011, and 2012
// revisions (versions 05, 06, 07) carry the same elements — those releases
// revised card design and security requirements rather than the DL subfile —
// so they share this array instead of duplicating it. Sharing the field object
// references also keeps the `_inlineOptionSets` WeakMap warm across versions.
const V04_FIELDS: AAMVAField[] = [
  { code: "DCA", label: "Vehicle Class", type: "string", required: true },
  { code: "DCB", label: "Restriction Codes", type: "string", required: true },
  { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
  { code: "DBA", label: "Expiration Date", type: "date", required: true },
  { code: "DCS", label: "Customer Family Name", type: "string", required: true },
  { code: "DAC", label: "Customer First Name", type: "string", required: true },
  { code: "DAD", label: "Customer Middle Name", type: "string" },
  { code: "DBD", label: "Document Issue Date", type: "date", required: true },
  { code: "DBB", label: "Date of Birth", type: "date", required: true },
  { code: "DBC", label: "Sex", type: "char", required: true },
  { code: "DAY", label: "Eye Color", type: "string", required: true },
  { code: "DAU", label: "Height", type: "string", required: true },
  { code: "DAG", label: "Address Street", type: "string", required: true },
  { code: "DAH", label: "Address Line 2", type: "string" },
  { code: "DAI", label: "City", type: "string", required: true },
  { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
  { code: "DAK", label: "Postal Code", type: "zip", required: true },
  { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
  { code: "DCF", label: "Document Discriminator", type: "string", required: true },
  { code: "DCG", label: "Country Identification", type: "string", required: true },
  { code: "DCK", label: "Inventory Control Number", type: "string" },
  { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
  { code: "DDF", label: "First Name Truncation", type: "string", required: true },
  { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
  { code: "DCU", label: "Name Suffix", type: "string" },
  { code: "DAW", label: "Weight (pounds)", type: "string" },
  { code: "DAZ", label: "Hair Color", type: "string" },
  { code: "DCL", label: "Race/Ethnicity", type: "string" },
  { code: "DDA", label: "Compliance Type", type: "string" },
  { code: "DDB", label: "Card Revision Date", type: "date" }
];

/**
 * The 2025 Card Design Standard, AAMVA version 11.
 *
 * Built from the 2020 (version 10) DL subfile with the element-set changes the
 * standard lists. Verified against the published PDF, whose own example header
 * reads `AAMVA Version Number: 11`:
 *
 *   - `DCL` (race/ethnicity) is gone. The standard now records it as
 *     "Placeholder for future data element", so the code is reserved rather
 *     than reused. The AKA name elements and the HAZMAT expiry went with it;
 *     none of those were in this table to begin with.
 *   - `DDM`/`DDN`/`DDO`/`DDP` are added: CDL, non-domiciled, enhanced
 *     credential, and permit indicators. Each is F1N and "either absent or"
 *     the value 1, which is why the option tables above carry a single entry.
 *   - `DAK` is specified to zero-fill to nine digits ("e.g. 123450000"), not
 *     the eleven the shared length table carries. The table is left alone so a
 *     dashed ZIP+4 still validates and the encoder still strips the dash;
 *     `maxLength` on the field below is what narrows it for this version.
 *
 * `DDN` carries a constraint this table cannot express: the standard says it
 * "can only be present if the CDL Indicator is present". That belongs in
 * `validateCrossFieldConsistency` and is not implemented yet.
 */
const V11_FIELDS: AAMVAField[] = [
  { code: "DCA", label: "Vehicle Class", type: "string", required: true },
  { code: "DCB", label: "Restriction Codes", type: "string", required: true },
  { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
  { code: "DBA", label: "Expiration Date", type: "date", required: true },
  { code: "DCS", label: "Customer Family Name", type: "string", required: true },
  { code: "DAC", label: "Customer First Name", type: "string", required: true },
  { code: "DAD", label: "Customer Middle Name", type: "string" },
  { code: "DBD", label: "Document Issue Date", type: "date", required: true },
  { code: "DBB", label: "Date of Birth", type: "date", required: true },
  { code: "DBC", label: "Sex", type: "char", required: true },
  { code: "DAY", label: "Eye Color", type: "string", required: true },
  { code: "DAU", label: "Height", type: "string", required: true },
  { code: "DAG", label: "Address Street", type: "string", required: true },
  { code: "DAH", label: "Address Line 2", type: "string" },
  { code: "DAI", label: "City", type: "string", required: true },
  { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
  { code: "DAK", label: "Postal Code", type: "zip", required: true, maxLength: 9 },
  { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
  { code: "DCF", label: "Document Discriminator", type: "string", required: true },
  { code: "DCG", label: "Country Identification", type: "string", required: true },
  { code: "DCK", label: "Inventory Control Number", type: "string" },
  { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
  { code: "DDF", label: "First Name Truncation", type: "string", required: true },
  { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
  { code: "DCU", label: "Name Suffix", type: "string" },
  { code: "DAW", label: "Weight (pounds)", type: "string" },
  { code: "DAZ", label: "Hair Color", type: "string" },
  { code: "DDA", label: "REAL ID / Compliance Type", type: "string" },
  { code: "DDB", label: "Card Revision Date", type: "date" },
  { code: "DDK", label: "Organ Donor Indicator", type: "string" },
  { code: "DDL", label: "Veteran Indicator", type: "string" },
  { code: "DDD", label: "Limited Duration Document Indicator", type: "string" },
  { code: "DDM", label: "CDL Indicator", type: "char" },
  { code: "DDN", label: "Non-Domiciled Indicator", type: "char" },
  { code: "DDO", label: "Enhanced Credential Indicator", type: "char" },
  { code: "DDP", label: "Permit Indicator", type: "char" }
];

export const AAMVA_VERSIONS: Record<string, AAMVAVersionDef> = {
  "01": {
    name: "AAMVA DL/ID-2000 (Version 01)",
    fields: [
      { code: "DAA", label: "Full Name", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAH", label: "Address Line 2", type: "string" },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DAR", label: "Vehicle Class", type: "string" },
      { code: "DAS", label: "Restriction Codes", type: "string" },
      { code: "DAT", label: "Endorsement Codes", type: "string" },
      {
        code: "DBA",
        label: "Expiration Date",
        type: "date",
        required: true,
        dateFormat: "YYYYMMDD"
      },
      { code: "DBB", label: "Date of Birth", type: "date", required: true, dateFormat: "YYYYMMDD" },
      {
        code: "DBC",
        label: "Sex",
        type: "char",
        required: true,
        options: [
          { value: "M", label: "M — Male" },
          { value: "F", label: "F — Female" }
        ]
      },
      { code: "DBD", label: "Document Issue Date", type: "date", dateFormat: "YYYYMMDD" },
      { code: "DAU", label: "Height", type: "string" },
      { code: "DAY", label: "Eye Color", type: "string" },
      { code: "DAW", label: "Weight", type: "string" }
    ]
  },
  "02": {
    name: "AAMVA CDS 2003 (Version 02)",
    fields: [
      { code: "DCT", label: "Customer Given Names", type: "string", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAH", label: "Address Line 2", type: "string" },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DAW", label: "Weight (pounds)", type: "string", required: true },
      { code: "DAX", label: "Weight (kilograms)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" }
    ]
  },
  "03": {
    name: "AAMVA DL/ID-2005 (Version 03)",
    fields: [
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAH", label: "Address Line 2", type: "string" },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DCK", label: "Inventory Control Number", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" }
    ]
  },
  "04": {
    name: "AAMVA DL/ID-2009 (Version 04)",
    fields: V04_FIELDS
  },
  "05": {
    name: "AAMVA DL/ID-2010 (Version 05)",
    fields: V04_FIELDS
  },
  "06": {
    name: "AAMVA DL/ID-2011 (Version 06)",
    fields: V04_FIELDS
  },
  "07": {
    name: "AAMVA DL/ID-2012 (Version 07)",
    fields: V04_FIELDS
  },
  "08": {
    name: "AAMVA DL/ID-2013 (Version 08)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAH", label: "Address Line 2", type: "string" },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DCK", label: "Inventory Control Number", type: "string" },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" },
      { code: "DDK", label: "Organ Donor Indicator", type: "string" },
      { code: "DDL", label: "Veteran Indicator", type: "string" },
      { code: "DDD", label: "Limited Duration Document Indicator", type: "string" }
    ]
  },
  "09": {
    name: "AAMVA DL/ID-2016 (Version 09)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAH", label: "Address Line 2", type: "string" },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DCK", label: "Inventory Control Number", type: "string" },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" },
      { code: "DDK", label: "Organ Donor Indicator", type: "string" },
      { code: "DDL", label: "Veteran Indicator", type: "string" },
      { code: "DDD", label: "Limited Duration Document Indicator", type: "string" }
    ]
  },
  "10": {
    name: "AAMVA DL/ID-2020 (Version 10)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAH", label: "Address Line 2", type: "string" },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DCK", label: "Inventory Control Number", type: "string" },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" },
      { code: "DDK", label: "Organ Donor Indicator", type: "string" },
      { code: "DDL", label: "Veteran Indicator", type: "string" },
      { code: "DDD", label: "Limited Duration Document Indicator", type: "string" }
    ]
  },
  "11": {
    name: "AAMVA DL/ID-2025 (Version 11)",
    fields: V11_FIELDS
  }
};

/**
 * Version tokens in ascending order.
 *
 * `Object.keys(AAMVA_VERSIONS)` cannot be used for display: "10" is a canonical
 * integer-like key, so JavaScript hoists it ahead of the zero-padded string keys
 * "01".."09" and every dropdown built from it listed version 10 first. The keys
 * are all two-digit and zero-padded, so a plain lexicographic sort is correct.
 */
export const AAMVA_VERSION_KEYS: readonly string[] = Object.keys(AAMVA_VERSIONS).sort();

/** True when `v` is a version this app can build a form and a payload for. */
export function isSupportedVersion(v: string): boolean {
  return Object.prototype.hasOwnProperty.call(AAMVA_VERSIONS, v);
}

/**
 * The cap that actually applies to a field.
 *
 * A field's own `maxLength` wins so a version can tighten a shared table entry
 * — CDS 2025 narrows DAK to nine while the table stays at eleven. Both the
 * validator and the form control read this, because deriving the input's
 * `maxLength` from the shared table alone let a user type eleven characters
 * into a field validation would then reject at nine.
 */
export function getEffectiveMaxLength(field: AAMVAField): number | undefined {
  return field.maxLength ?? AAMVA_FIELD_LIMITS[field.code];
}

export function getFieldsForVersion(v: string): AAMVAField[] {
  return AAMVA_VERSIONS[v]?.fields || [];
}

// Pre-built Sets of excluded field codes per state — avoids repeated Set construction.
const _EXCLUDED_SETS: Readonly<Record<string, ReadonlySet<string>>> = Object.fromEntries(
  Object.entries(AAMVA_STATE_EXCLUDED_FIELDS).map(([k, v]) => [k, new Set(v)])
);

// Memoization cache for getFieldsForStateAndVersion — the set of (state, version) combos
// is small and fixed at runtime, so this Map grows to at most ~54×10 = 540 entries.
const _stateVersionFieldCache = new Map<string, AAMVAField[]>();

export function getFieldsForStateAndVersion(stateCode: string, v: string): AAMVAField[] {
  const cacheKey = `${stateCode}:${v}`;
  const cached = _stateVersionFieldCache.get(cacheKey);
  if (cached) return cached;

  const allFields = getFieldsForVersion(v);
  let result: AAMVAField[];

  if (!stateCode) {
    result = allFields;
  } else {
    const excludedSet = _EXCLUDED_SETS[stateCode];
    if (!excludedSet || excludedSet.size === 0) {
      result = allFields;
    } else {
      result = allFields.filter((f) => f.required || !excludedSet.has(f.code));
    }
  }

  // Elements of the jurisdiction's own Z* subfile, appended so the form renders
  // them and the store holds them like any other value. They are tagged
  // `subfile: "jurisdiction"` and never written into the DL/ID subfile — see
  // the partition in `generateAAMVAPayload`.
  const jurisdictionElements = stateCode ? getJurisdictionSubfileElements(stateCode) : [];
  if (jurisdictionElements.length > 0) {
    result = result.concat(
      jurisdictionElements.map((el) => ({
        code: el.code,
        label: el.label,
        type: "string" as const,
        subfile: "jurisdiction" as const,
        maxLength: el.maxLength
      }))
    );
  }

  _stateVersionFieldCache.set(cacheKey, result);
  return result;
}

// Derived from the same list the form renders, so the set of fields the
// generator demands can never drift from the set the user was shown. Reading
// the version table directly (and ignoring `stateCode`, as this used to) only
// happened to agree because the exclusion filter above keeps required fields.
export function getMandatoryFields(stateCode: string, version: string): AAMVAField[] {
  return getFieldsForStateAndVersion(stateCode, version).filter((f) => f.required);
}

export function describeVersion(v: string): string {
  const info = AAMVA_VERSIONS[v];
  if (!info) return "Unknown version";

  return (
    `Version: ${info.name}\n` +
    `Fields:\n` +
    info.fields.map((f) => `${f.code} — ${f.label}${f.required ? " (mandatory)" : ""}`).join("\n")
  );
}
