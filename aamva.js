/*
  AAMVA MASTER SCHEMA – Versioned Payload Generator
  Supports AAMVA DL/ID barcode versions 01, 04, 07, 08, 09, and 10
  Does not implement versions 02, 03, 05, or 06
  Supports all 50 U.S. states via standardized IIN table (District of Columbia and U.S. territories not included)
  Exports:
    - AAMVA_VERSIONS
    - AAMVA_STATES
    - buildAAMVAPayload()
*/

/* ============================================================
   50-STATE IIN TABLE
   ============================================================ */

export const AAMVA_STATES = {
  "AL": { IIN: "636000", jurisdictionVersion: 8 },
  "AK": { IIN: "636010", jurisdictionVersion: 8 },
  "AZ": { IIN: "636020", jurisdictionVersion: 8 },
  "AR": { IIN: "636030", jurisdictionVersion: 8 },
  "CA": { IIN: "636040", jurisdictionVersion: 8 },
  "CO": { IIN: "636050", jurisdictionVersion: 8 },
  "CT": { IIN: "636060", jurisdictionVersion: 8 },
  "DE": { IIN: "636070", jurisdictionVersion: 8 },
  "FL": { IIN: "636080", jurisdictionVersion: 8 },
  "GA": { IIN: "636090", jurisdictionVersion: 8 },
  "HI": { IIN: "636100", jurisdictionVersion: 8 },
  "ID": { IIN: "636110", jurisdictionVersion: 8 },
  "IL": { IIN: "636120", jurisdictionVersion: 8 },
  "IN": { IIN: "636130", jurisdictionVersion: 8 },
  "IA": { IIN: "636140", jurisdictionVersion: 8 },
  "KS": { IIN: "636150", jurisdictionVersion: 8 },
  "KY": { IIN: "636160", jurisdictionVersion: 8 },
  "LA": { IIN: "636170", jurisdictionVersion: 8 },
  "ME": { IIN: "636180", jurisdictionVersion: 8 },
  "MD": { IIN: "636190", jurisdictionVersion: 8 },
  "MA": { IIN: "636200", jurisdictionVersion: 8 },
  "MI": { IIN: "636210", jurisdictionVersion: 8 },
  "MN": { IIN: "636220", jurisdictionVersion: 8 },
  "MS": { IIN: "636230", jurisdictionVersion: 8 },
  "MO": { IIN: "636240", jurisdictionVersion: 8 },
  "MT": { IIN: "636250", jurisdictionVersion: 8 },
  "NE": { IIN: "636260", jurisdictionVersion: 8 },
  "NV": { IIN: "636270", jurisdictionVersion: 8 },
  "NH": { IIN: "636280", jurisdictionVersion: 8 },
  "NJ": { IIN: "636290", jurisdictionVersion: 8 },
  "NM": { IIN: "636300", jurisdictionVersion: 8 },
  "NY": { IIN: "636310", jurisdictionVersion: 8 },
  "NC": { IIN: "636320", jurisdictionVersion: 8 },
  "ND": { IIN: "636330", jurisdictionVersion: 8 },
  "OH": { IIN: "636340", jurisdictionVersion: 8 },
  "OK": { IIN: "636350", jurisdictionVersion: 8 },
  "OR": { IIN: "636360", jurisdictionVersion: 8 },
  "PA": { IIN: "636370", jurisdictionVersion: 8 },
  "RI": { IIN: "636380", jurisdictionVersion: 8 },
  "SC": { IIN: "636390", jurisdictionVersion: 8 },
  "SD": { IIN: "636400", jurisdictionVersion: 8 },
  "TN": { IIN: "636410", jurisdictionVersion: 8 },
  "TX": { IIN: "636420", jurisdictionVersion: 8 },
  "UT": { IIN: "636430", jurisdictionVersion: 8 },
  "VT": { IIN: "636440", jurisdictionVersion: 8 },
  "VA": { IIN: "636450", jurisdictionVersion: 8 },
  "WA": { IIN: "636460", jurisdictionVersion: 8 },
  "WV": { IIN: "636470", jurisdictionVersion: 8 },
  "WI": { IIN: "636480", jurisdictionVersion: 8 },
  "WY": { IIN: "636490", jurisdictionVersion: 8 }
};

/* ============================================================
   HEADER BUILDER (used by all versions)
   ============================================================ */

function makeHeader(version, payload) {
  return (
    "@" +
    "ANSI " +
    payload.IIN +
    version.toString().padStart(2, "0") +
    payload.jurisdictionVersion.toString().padStart(2, "0") +
    "01"
  );
}

/* ============================================================
   BEGIN VERSION DEFINITIONS
   ============================================================ */

export const AAMVA_VERSIONS = {
  /* ============================================================
     VERSION 01 (legacy pre-2000)
     ============================================================ */

  "01": {
    version: 1,
    desc: "Legacy format (pre-2000)",
    header: payload => makeHeader(1, payload),
    subfileType: "DL",
    fields: [
      { code: "DAQ", required: true }, // Customer ID
      { code: "DCS", required: true }, // Family Name
      { code: "DAC", required: true }, // First Name
      { code: "DBB", required: true }, // DOB YYYYMMDD
      { code: "DBA", required: true }, // Expiration
      { code: "DAG", required: true }, // Street
      { code: "DAI", required: true }, // City
      { code: "DAJ", required: true }, // State
      { code: "DAK", required: true }, // ZIP
      { code: "DAY", required: false }, // Eye Color
      { code: "DAU", required: false }  // Height
    ]
  },

  /* ============================================================
     VERSION 04 (mid-2000s)
     ============================================================ */

  "04": {
    version: 4,
    desc: "2005-era AAMVA standard",
    header: payload => makeHeader(4, payload),
    subfileType: "DL",
    fields: [
      { code: "DAQ", required: true }, // Customer ID
      { code: "DCS", required: true }, // Last Name
      { code: "DAC", required: true }, // First Name
      { code: "DAD", required: false }, // Middle Name
      { code: "DBD", required: true }, // Issue Date
      { code: "DBB", required: true }, // DOB
      { code: "DBA", required: true }, // Expiration
      { code: "DAG", required: true }, // Street
      { code: "DAI", required: true }, // City
      { code: "DAJ", required: true }, // State
      { code: "DAK", required: true }, // ZIP
      { code: "DAY", required: true }, // Eye
      { code: "DAU", required: true }  // Height
    ]
  },

  /* ============================================================
     VERSION 07 (widespread modern)
     ============================================================ */

  "07": {
    version: 7,
    desc: "Modern AAMVA format, widely adopted",
    header: payload => makeHeader(7, payload),
    subfileType: "DL",
    fields: [
      { code: "DAQ", required: true }, // ID Number
      { code: "DCS", required: true }, // Last Name
      { code: "DAC", required: true }, // First Name
      { code: "DAD", required: false }, // Middle Name
      { code: "DBD", required: true }, // Issue Date
      { code: "DBB", required: true }, // DOB
      { code: "DBA", required: true }, // Expiration
      { code: "DBC", required: true }, // Gender
      { code: "DAY", required: true }, // Eye Color
      { code: "DAU", required: true }, // Height
      { code: "DAG", required: true }, // Street
      { code: "DAI", required: true }, // City
      { code: "DAJ", required: true }, // State
      { code: "DAK", required: true }, // ZIP
      { code: "DCF", required: false }, // Document Discriminator
      { code: "DCG", required: false }  // Country Code
    ]
  },

  /* ============================================================
     VERSION 08 (current standard)
     ============================================================ */

  "08": {
    version: 8,
    desc: "Current AAMVA standard, used by most states",
    header: payload => makeHeader(8, payload),
    subfileType: "DL",
    fields: [
      { code: "DAQ", required: true }, // Customer ID
      { code: "DCS", required: true }, // Last Name
      { code: "DAC", required: true }, // First Name
      { code: "DAD", required: false }, // Middle
      { code: "DBD", required: true }, // Issue
      { code: "DBB", required: true }, // DOB
      { code: "DBA", required: true }, // Expiration
      { code: "DBC", required: true }, // Gender
      { code: "DAU", required: true }, // Height
      { code: "DAY", required: true }, // Eye Color
      { code: "DAG", required: true }, // Street
      { code: "DAI", required: true }, // City
      { code: "DAJ", required: true }, // State
      { code: "DAK", required: true }, // ZIP

      /* Optional truncation / metadata fields */
      { code: "DCF", required: false }, // Document Discriminator
      { code: "DCG", required: false }, // Country
      { code: "DDE", required: false }, // Suffix Truncation
      { code: "DDF", required: false }, // First Name Truncation
      { code: "DDG", required: false }  // Middle Name Truncation
    ]
  },
  /* ============================================================
     VERSION 09 (US + Canada harmonized, expanded fields)
     ============================================================ */

  "09": {
    version: 9,
    desc: "Advanced AAMVA + Canadian harmonization with alias fields",
    header: payload => makeHeader(9, payload),
    subfileType: "DL",
    fields: [
      { code: "DAQ", required: true }, // Customer ID
      { code: "DCS", required: true }, // Last Name
      { code: "DAC", required: true }, // First Name
      { code: "DAD", required: false }, // Middle Name
      { code: "DBD", required: true }, // Issue Date
      { code: "DBB", required: true }, // DOB
      { code: "DBA", required: true }, // Exp Date
      { code: "DBC", required: true }, // Gender
      { code: "DAU", required: true }, // Height
      { code: "DAY", required: true }, // Eye
      { code: "DAG", required: true }, // Street
      { code: "DAI", required: true }, // City
      { code: "DAJ", required: true }, // State
      { code: "DAK", required: true }, // ZIP

      /* New in Version 09 */
      { code: "DAW", required: false }, // Weight
      { code: "DAZ", required: false }, // Hair Color
      { code: "DCI", required: false }, // Place of Birth
      { code: "DCJ", required: false }, // Audit Number
      { code: "DCK", required: false }, // Inventory Control Number

      /* Alias / alternate identity fields */
      { code: "DBG", required: false }, // Alias Given Name
      { code: "DBN", required: false }, // Alias DOB
      { code: "DBS", required: false }, // Alias Surname

      /* Name suffix code */
      { code: "DCU", required: false }  // Suffix Code
    ]
  },

  /* ============================================================
     VERSION 10 (REAL ID era)
     ============================================================ */

  "10": {
    version: 10,
    desc: "REAL ID + Mobile DL compatibility expansion",
    header: payload => makeHeader(10, payload),
    subfileType: "DL",
    fields: [
      { code: "DAQ", required: true }, // ID Number
      { code: "DCS", required: true }, // Last Name
      { code: "DAC", required: true }, // First Name
      { code: "DAD", required: false }, // Middle
      { code: "DBD", required: true }, // Issue
      { code: "DBB", required: true }, // DOB
      { code: "DBA", required: true }, // Expiration
      { code: "DBC", required: true }, // Gender
      { code: "DAU", required: true }, // Height
      { code: "DAY", required: true }, // Eye
      { code: "DAG", required: true }, // Street
      { code: "DAI", required: true }, // City
      { code: "DAJ", required: true }, // State
      { code: "DAK", required: true }, // ZIP

      /* Document metadata */
      { code: "DCF", required: false }, // Document Discriminator
      { code: "DCG", required: false }, // Country

      /* REAL ID-specific */
      { code: "DCH", required: false }, // REAL ID Indicator (e.g., “1”)
      { code: "DDA", required: false }, // Compliance Indicator
      { code: "DDB", required: false }, // Revision Date
      { code: "DDC", required: false }, // Hazmat Endorsement Indicator
      { code: "DDD", required: false }, // Limited Duration Indicator

      /* Truncation / metadata fields */
      { code: "DDE", required: false },
      { code: "DDF", required: false },
      { code: "DDG", required: false }
    ]
  }
}; /* END AAMVA_VERSIONS */
/* ============================================================
   PAYLOAD BUILDER
   ============================================================ */

/*
  buildAAMVAPayload(input, stateCode, versionCode)

  - Takes the input fields gathered from the UI
  - Validates against the chosen AAMVA version schema
  - Builds the AAMVA header
  - Builds the DL subfile
  - Returns a final text payload ready for PDF417 encoding
*/

export function buildAAMVAPayload(input, stateCode, versionCode) {
  const state = AAMVA_STATES[stateCode];
  if (!state) {
    throw new Error(`Invalid state code: ${stateCode}`);
  }

  const version = AAMVA_VERSIONS[versionCode];
  if (!version) {
    throw new Error(`Invalid AAMVA version: ${versionCode}`);
  }

  // Start building the DL subfile
  let subfile = version.subfileType + "\n";

  // Validate and append each field in order
  version.fields.forEach(field => {
    const value = input[field.code];

    if (field.required && (!value || value.trim() === "")) {
      throw new Error(`Missing required field: ${field.code}`);
    }

    if (value && value.trim() !== "") {
      subfile += field.code + value.trim() + "\n";
    }
  });

  // Build header
  const header = version.header({
    IIN: state.IIN,
    jurisdictionVersion: state.jurisdictionVersion
  });

  // Final full payload
  return header + "\n" + subfile;
}
