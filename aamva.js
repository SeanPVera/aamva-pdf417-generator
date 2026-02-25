/*
 * AAMVA Specification Handler
 * Provides:
 * - State metadata (official IINs from AAMVA) with full state names
 * - AAMVA version definitions (01-10) with correct mandatory/optional fields
 * - Auto-selection of AAMVA version by state
 * - Schema loader
 * - Field inspectors with length limits and constrained value options
 * - Version browser support
 * - Payload generator (AAMVA compliant)
 *
 * IIN data source: https://www.aamva.org/identity/issuer-identification-numbers-(iin)
 * Version history:
 *   01 = AAMVA DL/ID-2000
 *   02 = AAMVA CDS 1.0, 09-2003
 *   03 = AAMVA CDS 2.0, 03-2005
 *   04 = AAMVA CDS 1.0, 07-2009
 *   05 = AAMVA CDS 1.0, 07-2010
 *   06 = AAMVA CDS 1.0, 07-2011
 *   07 = AAMVA CDS 1.0, 06-2012
 *   08 = AAMVA CDS 1.0, 08-2013
 *   09 = AAMVA DL/ID-2016
 *   10 = AAMVA DL/ID-2020
 */

/* ========== STATE DEFINITIONS ========== */
// IINs sourced from official AAMVA Issuer Identification Numbers registry.
// aamvaVersion = the AAMVA CDS version currently used by each state for
// newly-issued credentials. Most states now issue on version 10 (2020 CDS).
// States known to still use version 09 (2016 CDS) are noted.

window.AAMVA_STATES = {
  AL: { IIN: "636033", name: "Alabama", aamvaVersion: "09" },
  AK: { IIN: "636059", name: "Alaska", aamvaVersion: "09" },
  AZ: { IIN: "636026", name: "Arizona", aamvaVersion: "10" },
  AR: { IIN: "636021", name: "Arkansas", aamvaVersion: "09" },
  CA: { IIN: "636014", name: "California", aamvaVersion: "10" },
  CO: { IIN: "636020", name: "Colorado", aamvaVersion: "10" },
  CT: { IIN: "636006", name: "Connecticut", aamvaVersion: "09" },
  DE: { IIN: "636011", name: "Delaware", aamvaVersion: "09" },
  FL: { IIN: "636010", name: "Florida", aamvaVersion: "10" },
  GA: { IIN: "636055", name: "Georgia", aamvaVersion: "10" },
  HI: { IIN: "636047", name: "Hawaii", aamvaVersion: "10" },
  ID: { IIN: "636050", name: "Idaho", aamvaVersion: "09" },
  IL: { IIN: "636035", name: "Illinois", aamvaVersion: "10" },
  IN: { IIN: "636037", name: "Indiana", aamvaVersion: "09" },
  IA: { IIN: "636018", name: "Iowa", aamvaVersion: "09" },
  KS: { IIN: "636022", name: "Kansas", aamvaVersion: "09" },
  KY: { IIN: "636046", name: "Kentucky", aamvaVersion: "09" },
  LA: { IIN: "636007", name: "Louisiana", aamvaVersion: "09" },
  ME: { IIN: "636041", name: "Maine", aamvaVersion: "09" },
  MD: { IIN: "636003", name: "Maryland", aamvaVersion: "10" },
  MA: { IIN: "636002", name: "Massachusetts", aamvaVersion: "09" },
  MI: { IIN: "636032", name: "Michigan", aamvaVersion: "10" },
  MN: { IIN: "636038", name: "Minnesota", aamvaVersion: "09" },
  MS: { IIN: "636051", name: "Mississippi", aamvaVersion: "09" },
  MO: { IIN: "636030", name: "Missouri", aamvaVersion: "09" },
  MT: { IIN: "636008", name: "Montana", aamvaVersion: "09" },
  NE: { IIN: "636054", name: "Nebraska", aamvaVersion: "10" },
  NV: { IIN: "636049", name: "Nevada", aamvaVersion: "09" },
  NH: { IIN: "636039", name: "New Hampshire", aamvaVersion: "09" },
  NJ: { IIN: "636036", name: "New Jersey", aamvaVersion: "10" },
  NM: { IIN: "636009", name: "New Mexico", aamvaVersion: "09" },
  NY: { IIN: "636001", name: "New York", aamvaVersion: "10" },
  NC: { IIN: "636004", name: "North Carolina", aamvaVersion: "10" },
  ND: { IIN: "636034", name: "North Dakota", aamvaVersion: "09" },
  OH: { IIN: "636023", name: "Ohio", aamvaVersion: "10" },
  OK: { IIN: "636058", name: "Oklahoma", aamvaVersion: "09" },
  OR: { IIN: "636029", name: "Oregon", aamvaVersion: "10" },
  PA: { IIN: "636025", name: "Pennsylvania", aamvaVersion: "10" },
  RI: { IIN: "636052", name: "Rhode Island", aamvaVersion: "09" },
  SC: { IIN: "636005", name: "South Carolina", aamvaVersion: "10" },
  SD: { IIN: "636042", name: "South Dakota", aamvaVersion: "09" },
  TN: { IIN: "636053", name: "Tennessee", aamvaVersion: "09" },
  TX: { IIN: "636015", name: "Texas", aamvaVersion: "10" },
  UT: { IIN: "636040", name: "Utah", aamvaVersion: "09" },
  VT: { IIN: "636024", name: "Vermont", aamvaVersion: "09" },
  VA: { IIN: "636000", name: "Virginia", aamvaVersion: "10" },
  WA: { IIN: "636045", name: "Washington", aamvaVersion: "10" },
  WV: { IIN: "636061", name: "West Virginia", aamvaVersion: "09" },
  WI: { IIN: "636031", name: "Wisconsin", aamvaVersion: "10" },
  WY: { IIN: "636060", name: "Wyoming", aamvaVersion: "09" },
  DC: { IIN: "636043", name: "District of Columbia", aamvaVersion: "10" },

  // US Territories
  AS: { IIN: "604427", name: "American Samoa", aamvaVersion: "09" },
  GU: { IIN: "636019", name: "Guam", aamvaVersion: "09" },
  VI: { IIN: "636062", name: "US Virgin Islands", aamvaVersion: "09" },
  PR: { IIN: "604431", name: "Puerto Rico", aamvaVersion: "09" }
};

/* ========== CONSTRAINED FIELD OPTIONS ========== */
// AAMVA-defined value sets for fields with enumerated values.

window.AAMVA_FIELD_OPTIONS = {
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
  DCL: [
    { value: "AI", label: "AI — Alaskan/American Indian" },
    { value: "AP", label: "AP — Asian/Pacific Islander" },
    { value: "BK", label: "BK — Black" },
    { value: "H", label: "H — Hispanic Origin" },
    { value: "O", label: "O — Non-Hispanic" },
    { value: "U", label: "U — Unknown" },
    { value: "W", label: "W — White" }
  ]
};

/* ========== FIELD LENGTH LIMITS ========== */
// Maximum lengths per the AAMVA CDS specification.

window.AAMVA_FIELD_LIMITS = {
  DCS: 40,   // Family Name
  DAC: 40,   // First Name
  DAD: 40,   // Middle Name
  DAA: 125,  // Full Name (v01)
  DCT: 80,   // Given Names (v02)
  DCU: 5,    // Name Suffix
  DAG: 35,   // Address Street
  DAH: 35,   // Address Line 2
  DAI: 20,   // City
  DAJ: 2,    // Jurisdiction Code
  DAK: 11,   // Postal Code (XXXXX-XXXX or XXXXXXXXXXX)
  DAQ: 25,   // Customer ID Number
  DCA: 6,    // Vehicle Class
  DCB: 12,   // Restriction Codes
  DCD: 5,    // Endorsement Codes
  DBA: 8,    // Expiration Date
  DBB: 8,    // Date of Birth
  DBC: 1,    // Sex
  DBD: 8,    // Document Issue Date
  DAU: 6,    // Height (FT-IN or cm)
  DAY: 3,    // Eye Color
  DAZ: 3,    // Hair Color
  DAW: 3,    // Weight (pounds)
  DAX: 3,    // Weight (kilograms)
  DCF: 25,   // Document Discriminator
  DCG: 3,    // Country Identification
  DCL: 2,    // Race/Ethnicity
  DDE: 1,    // Family Name Truncation
  DDF: 1,    // First Name Truncation
  DDG: 1,    // Middle Name Truncation
  DDA: 1,    // Compliance Type
  DDB: 8,    // Card Revision Date
  DDK: 1,    // Organ Donor Indicator
  DDL: 1,    // Veteran Indicator
  DAR: 4,    // Vehicle Class (v01)
  DAS: 10,   // Restriction Codes (v01)
  DAT: 5     // Endorsement Codes (v01)
};

/* ========== VERSION DEFINITIONS ========== */
// Field definitions based on AAMVA CDS specifications.
// Mandatory (required: true) vs Optional fields per the published standard.

window.AAMVA_VERSIONS = {

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
      { code: "DBA", label: "Expiration Date", type: "date", required: true, dateFormat: "YYYYMMDD" },
      { code: "DBB", label: "Date of Birth", type: "date", required: true, dateFormat: "YYYYMMDD" },
      { code: "DBC", label: "Sex", type: "char", required: true,
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
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" }
    ]
  },

  "04": {
    name: "AAMVA DL/ID-2009 (Version 04)",
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
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "05": {
    name: "AAMVA DL/ID-2010 (Version 05)",
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
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "06": {
    name: "AAMVA DL/ID-2011 (Version 06)",
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
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "07": {
    name: "AAMVA DL/ID-2012 (Version 07)",
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
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
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
      { code: "DDL", label: "Veteran Indicator", type: "string" }
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
      { code: "DDL", label: "Veteran Indicator", type: "string" }
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
      { code: "DDL", label: "Veteran Indicator", type: "string" }
    ]
  }
};

/* ========== UTILITIES ========== */

// Required for "unknown field" validation
window.AAMVA_UNKNOWN_FIELD_POLICY = "reject";

// Get the default AAMVA version for a state
window.getVersionForState = function(stateCode) {
  const stateDef = window.AAMVA_STATES[stateCode];
  if (!stateDef) return null;
  return stateDef.aamvaVersion || "10";
};

// Get field definitions by version
window.getFieldsForVersion = function(v) {
  return window.AAMVA_VERSIONS[v]?.fields || [];
};

// Get mandatory fields for a specific state and version
window.getMandatoryFields = function(stateCode, version) {
  const versionDef = window.AAMVA_VERSIONS[version];
  if (!versionDef) return [];
  return versionDef.fields.filter(f => f.required);
};

// Inspector helper
window.describeVersion = function(v) {
  const info = window.AAMVA_VERSIONS[v];
  if (!info) return "Unknown version";

  return (
    `Version: ${info.name}\n` +
    `Fields:\n` +
    info.fields.map(f => `${f.code} — ${f.label}${f.required ? " (mandatory)" : ""}`).join("\n")
  );
};

// Validate field, type, required-ness, and length limits
window.validateFieldValue = function(field, value) {
  if (field.required && !value) return false;
  if (!value) return true;

  // Enforce constrained option sets when present.
  // Prioritize version-specific options if available (e.g. DBC in v01)
  const constrainedOptions = field.options || (window.AAMVA_FIELD_OPTIONS && window.AAMVA_FIELD_OPTIONS[field.code]);

  if (Array.isArray(constrainedOptions) && constrainedOptions.length > 0) {
    const allowedValues = new Set(constrainedOptions.map(opt => opt.value));
    if (!allowedValues.has(value)) return false;
  }

  // Check length limit
  const maxLen = window.AAMVA_FIELD_LIMITS[field.code];
  if (maxLen && value.length > maxLen) return false;

  switch (field.type) {
    case "date":
      // Check for version-specific date format override (e.g., v01 uses YYYYMMDD)
      const dateFormat = field.dateFormat || "MMDDYYYY";

      if (!/^\d{8}$/.test(value)) return false;

      let year, month, day;
      if (dateFormat === "YYYYMMDD") {
        year  = Number.parseInt(value.substring(0, 4), 10);
        month = Number.parseInt(value.substring(4, 6), 10);
        day   = Number.parseInt(value.substring(6, 8), 10);
      } else {
        // Default: MMDDYYYY (and MMDDCCYY)
        month = Number.parseInt(value.substring(0, 2), 10);
        day   = Number.parseInt(value.substring(2, 4), 10);
        year  = Number.parseInt(value.substring(4, 8), 10);
      }

      if (year < 1800 || year > 2200) return false;
      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;
      {
        const dt = new Date(Date.UTC(year, month - 1, day));
        return (
          dt.getUTCFullYear() === year &&
          dt.getUTCMonth() === (month - 1) &&
          dt.getUTCDate() === day
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
};

// Build minimal payload object for encoding.
// If valuesMap is provided, uses it directly (for Node/test environments).
// Otherwise reads from DOM elements (browser).
window.buildPayloadObject = function(stateCode, version, fields, valuesMap) {
  const obj = {
    state: stateCode,
    version: version
  };

  if (valuesMap) {
    // Use provided values map (Node.js / test environment)
    fields.forEach(f => {
      obj[f.code] = valuesMap[f.code] || "";
    });
  } else {
    // Read from DOM (browser environment)
    fields.forEach(f => {
      const el = typeof document !== "undefined" && document.getElementById(f.code);
      if (el) obj[f.code] = el.value || "";
    });
  }

  return obj;
};

// Generate AAMVA compliant payload string
window.generateAAMVAPayload = function(stateCode, version, fields, dataObj) {
  if (!window.AAMVA_STATES[stateCode]) {
    throw new Error(`Unknown state code: ${stateCode}`);
  }
  if (!window.AAMVA_VERSIONS[version]) {
    throw new Error(`Unsupported AAMVA version: ${version}`);
  }

  // VALIDATION: Check mandatory fields
  const mandatoryFields = window.getMandatoryFields(stateCode, version);
  const missing = [];
  mandatoryFields.forEach(f => {
    if (!dataObj[f.code]) {
      missing.push(`${f.label} (${f.code})`);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing mandatory fields for ${stateCode} (v${version}): ${missing.join(", ")}`);
  }

  // Consistency Check: Ensure DAJ (Jurisdiction Code) matches selected State if present
  if (dataObj.DAJ && dataObj.DAJ !== stateCode) {
    dataObj.DAJ = stateCode;
  }

  // Sanitize: normalize to ASCII printable + strip control chars from all field values.
  // AAMVA payload directory offsets are byte-based, so we keep payload text 7-bit ASCII.
  // Also force UPPERCASE for standard alphanumeric fields for better compliance.
  for (const field of fields) {
    if (dataObj[field.code]) {
      let val = dataObj[field.code];

      // Force uppercase for string/char/zip fields (dates are numeric)
      if (field.type === "string" || field.type === "char" || field.type === "zip") {
         val = val.toUpperCase();
      }

      dataObj[field.code] = val
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7e]/g, "")
        .replace(/[\x00-\x1f\x7f]/g, "");
    }
  }

  const stateDef = window.AAMVA_STATES[stateCode];
  const iin = stateDef.IIN;
  const jurisVersion = "00"; // Jurisdiction-specific version (00 default)

  // Header
  const compliance = "@";
  const dataElementSeparator = "\n";
  const recordSeparator = "\x1e";
  const segmentTerminator = "\r";
  const fileType = "ANSI ";

  // Header Part 1
  let header = compliance + dataElementSeparator + recordSeparator + segmentTerminator + fileType + iin + version + jurisVersion;

  // Subfiles
  // We only support "DL" (Driver License)
  const subfileType = "DL";

  // Build Subfile Data first to calculate length
  let subfileData = subfileType;

  // Fields
  for (const field of fields) {
    let val = dataObj[field.code];
    if (val !== undefined && val !== "") {
      // AAMVA CDS requires DAK (Postal Code) to be exactly 11 characters,
      // left-justified and space-padded. Strip any hyphen from ZIP+4 before padding.
      if (field.code === "DAK") {
        const stripped = val.replace(/-/g, "");
        val = stripped.padEnd(11, " ").substring(0, 11);
      }
      subfileData += field.code + val + dataElementSeparator;
    }
  }

  subfileData += segmentTerminator;

  // Calculate offsets
  const numEntries = "01"; // We only have DL

  // Header fixed part:
  // @(1) + \n(1) + \x1e(1) + \r(1) + ANSI (5) + IIN(6) + Ver(2) + JVer(2) + NumEntries(2) = 21 bytes.
  // Subfile Directory Entry: Type(2) + Offset(4) + Length(4) = 10 bytes.

  const headerLength = 21 + (1 * 10);
  const offset = headerLength;

  const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
  const length = textEncoder ? textEncoder.encode(subfileData).length : subfileData.length;

  if (length > 9999) {
    throw new Error("Generated DL subfile exceeds 4-digit directory length limit (9999 bytes).");
  }

  const offsetStr = offset.toString().padStart(4, '0');
  const lengthStr = length.toString().padStart(4, '0');

  const subfileDir = subfileType + offsetStr + lengthStr;

  const payload = header + numEntries + subfileDir + subfileData;

  // Defensive consistency check: directory length must match encoded subfile bytes.
  const actualLength = textEncoder ? textEncoder.encode(subfileData).length : subfileData.length;
  if (actualLength !== length) {
    throw new Error("AAMVA payload directory length mismatch.");
  }

  return payload;
};
