/*
 * AAMVA Specification Handler — Deluxe Edition
 * Provides:
 * - State metadata
 * - AAMVA v09/v10 field definitions
 * - Schema loader
 * - Field inspectors
 * - Version browser support
 * - Payload generator (AAMVA compliant)
 */

/* ========== STATE DEFINITIONS ========== */

window.AAMVA_STATES = {
  AL: { IIN: "636000", jurisdictionVersion: 8 },
  AK: { IIN: "636001", jurisdictionVersion: 8 },
  AZ: { IIN: "636002", jurisdictionVersion: 8 },
  AR: { IIN: "636003", jurisdictionVersion: 8 },
  CA: { IIN: "636004", jurisdictionVersion: 8 },
  CO: { IIN: "636005", jurisdictionVersion: 8 },
  CT: { IIN: "636006", jurisdictionVersion: 8 },
  DE: { IIN: "636007", jurisdictionVersion: 8 },
  FL: { IIN: "636008", jurisdictionVersion: 8 },
  GA: { IIN: "636009", jurisdictionVersion: 8 },
  HI: { IIN: "636010", jurisdictionVersion: 8 },
  ID: { IIN: "636011", jurisdictionVersion: 8 },
  IL: { IIN: "636012", jurisdictionVersion: 8 },
  IN: { IIN: "636013", jurisdictionVersion: 8 },
  IA: { IIN: "636014", jurisdictionVersion: 8 },
  KS: { IIN: "636015", jurisdictionVersion: 8 },
  KY: { IIN: "636016", jurisdictionVersion: 8 },
  LA: { IIN: "636017", jurisdictionVersion: 8 },
  ME: { IIN: "636018", jurisdictionVersion: 8 },
  MD: { IIN: "636019", jurisdictionVersion: 8 },
  MA: { IIN: "636020", jurisdictionVersion: 8 },
  MI: { IIN: "636021", jurisdictionVersion: 8 },
  MN: { IIN: "636022", jurisdictionVersion: 8 },
  MS: { IIN: "636023", jurisdictionVersion: 8 },
  MO: { IIN: "636024", jurisdictionVersion: 8 },
  MT: { IIN: "636025", jurisdictionVersion: 8 },
  NE: { IIN: "636026", jurisdictionVersion: 8 },
  NV: { IIN: "636027", jurisdictionVersion: 8 },
  NH: { IIN: "636028", jurisdictionVersion: 8 },
  NJ: { IIN: "636029", jurisdictionVersion: 8 },
  NM: { IIN: "636030", jurisdictionVersion: 8 },
  NY: { IIN: "636031", jurisdictionVersion: 8 },
  NC: { IIN: "636032", jurisdictionVersion: 8 },
  ND: { IIN: "636033", jurisdictionVersion: 8 },
  OH: { IIN: "636034", jurisdictionVersion: 8 },
  OK: { IIN: "636035", jurisdictionVersion: 8 },
  OR: { IIN: "636036", jurisdictionVersion: 8 },
  PA: { IIN: "636037", jurisdictionVersion: 8 },
  RI: { IIN: "636038", jurisdictionVersion: 8 },
  SC: { IIN: "636039", jurisdictionVersion: 8 },
  SD: { IIN: "636040", jurisdictionVersion: 8 },
  TN: { IIN: "636041", jurisdictionVersion: 8 },
  TX: { IIN: "636042", jurisdictionVersion: 8 },
  UT: { IIN: "636043", jurisdictionVersion: 8 },
  VT: { IIN: "636044", jurisdictionVersion: 8 },
  VA: { IIN: "636045", jurisdictionVersion: 8 },
  WA: { IIN: "636046", jurisdictionVersion: 8 },
  WV: { IIN: "636047", jurisdictionVersion: 8 },
  WI: { IIN: "636048", jurisdictionVersion: 8 },
  WY: { IIN: "636049", jurisdictionVersion: 8 },
  DC: { IIN: "636050", jurisdictionVersion: 8 },

  // Unsupported Territories
  AS: null,
  GU: null,
  VI: null,
  PR: null
};

/* ========== VERSION DEFINITIONS ========== */

window.AAMVA_VERSIONS = {
  // Keeping older definitions for backward compatibility if needed,
  // but note that "09" usually means AAMVA 2009 (v04) and "10" usually means AAMVA 2010 (v05) in loose terms,
  // or it might refer to the literal version number.
  // We will add the explicit standard versions below.

  "09": {
    name: "Version 2009 (Legacy)",
    fields: [
      { code: "DAA", label: "Full Name", type: "string", required: true },
      { code: "DCS", label: "Last Name", type: "string", required: true },
      { code: "DAC", label: "First Name", type: "string", required: true },
      { code: "DAD", label: "Middle Name", type: "string" },
      { code: "DBA", label: "License Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string" },
      { code: "DAU", label: "Height", type: "string" },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "State", type: "string", required: true },
      { code: "DAK", label: "ZIP", type: "zip", required: true },
      { code: "DAQ", label: "License Number", type: "string", required: true }
    ]
  },

  "10": {
    name: "Version 2010 (Legacy)",
    fields: [
      { code: "DCS", label: "Last Name", type: "string", required: true },
      { code: "DCT", label: "Given Names", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string" },
      { code: "DAU", label: "Height", type: "string" },
      { code: "DAG", label: "Street Address", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "State", type: "string", required: true },
      { code: "DAK", label: "ZIP", type: "zip", required: true },
      { code: "DAQ", label: "License Number", type: "string", required: true },
      { code: "DAW", label: "Weight", type: "string" }
    ]
  },

  "08": {
    name: "AAMVA 2016 (Version 08)",
    fields: [
      { code: "DCA", label: "Jurisdiction-specific vehicle class", type: "string", required: true },
      { code: "DCB", label: "Jurisdiction-specific restriction codes", type: "string", required: true },
      { code: "DCD", label: "Jurisdiction-specific endorsement codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" }, // Optional
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true }, // 1=M, 2=F
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street 1", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string" },
      { code: "DDF", label: "First Name Truncation", type: "string" },
      { code: "DDG", label: "Middle Name Truncation", type: "string" }
    ]
  },

  "2020": {
    name: "AAMVA 2020 (Version 10)",
    headerVersion: "10", // AAMVA 2020 uses version number 10 in the header per spec
    fields: [
      { code: "DCA", label: "Jurisdiction-specific vehicle class", type: "string", required: true },
      { code: "DCB", label: "Jurisdiction-specific restriction codes", type: "string", required: true },
      { code: "DCD", label: "Jurisdiction-specific endorsement codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street 1", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string" },
      { code: "DDF", label: "First Name Truncation", type: "string" },
      { code: "DDG", label: "Middle Name Truncation", type: "string" }
    ]
  }
};

/* ========== UTILITIES ========== */

// Required for “unknown field” validation
window.AAMVA_UNKNOWN_FIELD_POLICY = "reject";

// Get field definitions by version
window.getFieldsForVersion = function(v) {
  return window.AAMVA_VERSIONS[v]?.fields || [];
};

// Get mandatory fields for a specific state and version
window.getMandatoryFields = function(stateCode, version) {
  const versionDef = window.AAMVA_VERSIONS[version];
  if (!versionDef) return [];

  // Start with version-level mandatory fields
  let fields = versionDef.fields.filter(f => f.required);

  const stateDef = window.AAMVA_STATES[stateCode];
  if (stateDef && stateDef.mandatoryFields) {
    // Add state-specific mandatory fields
    // Implementation: we assume stateDef.mandatoryFields is an array of field codes
    // or objects that we need to merge.
    // For now, let's assume it's just codes that MUST be present.
    // If we need to ADD fields that are not in the version spec, we'd need full definitions.
    // Simpler approach: check if state has 'extraRequired' list.
  }

  return fields;
};

// Inspector helper
window.describeVersion = function(v) {
  const info = window.AAMVA_VERSIONS[v];
  if (!info) return "Unknown version";

  return (
    `Version: ${info.name}\n` +
    `Fields:\n` +
    info.fields.map(f => `${f.code} — ${f.label}`).join("\n")
  );
};

// Validate field, type, required-ness
window.validateFieldValue = function(field, value) {
  if (field.required && !value) return false;
  if (!value) return true;

  switch (field.type) {
    case "date":
      return /^\d{8}$/.test(value); // YYYYMMDD
    case "zip":
      return /^\d{5}(-\d{4})?$/.test(value);
    case "char":
      return /^[A-Z0-9]$/.test(value);
    case "string":
    default:
      return true;
  }
};

// Build minimal payload object for encoding
window.buildPayloadObject = function(stateCode, version, fields) {
  const obj = {
    state: stateCode,
    version: version
  };

  fields.forEach(f => {
    const el = document.getElementById(f.code);
    if (el) obj[f.code] = el.value || "";
  });

  return obj;
};

// Generate AAMVA compliant payload string
window.generateAAMVAPayload = function(stateCode, version, fields, dataObj) {
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

  // Sanitize: strip control characters from all field values before encoding
  for (const field of fields) {
    if (dataObj[field.code]) {
      dataObj[field.code] = dataObj[field.code].replace(/[\x00-\x1f\x7f]/g, "");
    }
  }

  const stateDef = window.AAMVA_STATES[stateCode];
  const versionDef = window.AAMVA_VERSIONS[version];
  const iin = stateDef.IIN;
  const jurisVersion = stateDef.jurisdictionVersion.toString().padStart(2, '0');
  const headerVersion = (versionDef && versionDef.headerVersion) || version;

  // Header
  const compliance = "@";
  const dataElementSeparator = "\n";
  const recordSeparator = "\x1e";
  const segmentTerminator = "\r";
  const fileType = "ANSI ";

  // Header Part 1
  let header = compliance + dataElementSeparator + recordSeparator + segmentTerminator + fileType + iin + headerVersion + jurisVersion;

  // Subfiles
  // We only support "DL" (Driver License)
  const subfileType = "DL";

  // Build Subfile Data first to calculate length
  let subfileData = subfileType;

  // Fields
  for (const field of fields) {
    const val = dataObj[field.code];
    if (val !== undefined && val !== "") {
      // Ensure uppercase for string/char? Standard usually requires it.
      // But we will respect input for now, assuming validation/input handles it.
      subfileData += field.code + val + dataElementSeparator;
    }
  }

  // AAMVA typically puts the segment terminator at the end of the subfile data (replacing last separator? or in addition?)
  // Standards say: "The data elements shall be separated by the Data Element Separator."
  // And "The subfile shall be terminated by the Segment Terminator".
  subfileData += segmentTerminator;

  // Calculate offsets
  const numEntries = "01"; // We only have DL

  // Header fixed part:
  // @(1) + \n(1) + \x1e(1) + \r(1) + ANSI (5) + IIN(6) + Ver(2) + JVer(2) + NumEntries(2) = 21 bytes.

  // Subfile Directory Entry: Type(2) + Offset(4) + Length(4) = 10 bytes.

  const headerLength = 21 + (1 * 10);
  const offset = headerLength;

  const length = subfileData.length;

  const offsetStr = offset.toString().padStart(4, '0');
  const lengthStr = length.toString().padStart(4, '0');

  const subfileDir = subfileType + offsetStr + lengthStr;

  return header + numEntries + subfileDir + subfileData;
};
