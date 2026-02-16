const { test } = require("node:test");
const assert = require("node:assert/strict");

// Minimal browser global shim for loading the source files
global.window = global;

// Load source modules (they attach to window.*)
require("../lib/pdf417.js");
require("../aamva.js");
require("../decoder.js");

/* ============================================================
   AAMVA STATE DEFINITIONS
   ============================================================ */

test("all 50 states + DC have valid IIN definitions", () => {
  const states = window.AAMVA_STATES;
  const expected = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
    "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
  ];

  for (const code of expected) {
    assert.ok(states[code], `State ${code} should be defined`);
    assert.ok(states[code].IIN, `State ${code} should have an IIN`);
    assert.match(states[code].IIN, /^\d{6}$/, `State ${code} IIN should be 6 digits`);
  }
});

test("DC and UT have different IINs", () => {
  const dc = window.AAMVA_STATES.DC;
  const ut = window.AAMVA_STATES.UT;
  assert.notEqual(dc.IIN, ut.IIN, "DC and UT must have different IINs");
});

test("unsupported territories are null", () => {
  assert.equal(window.AAMVA_STATES.AS, null);
  assert.equal(window.AAMVA_STATES.GU, null);
  assert.equal(window.AAMVA_STATES.VI, null);
  assert.equal(window.AAMVA_STATES.PR, null);
});

test("no duplicate IINs across states", () => {
  const seen = {};
  for (const [code, def] of Object.entries(window.AAMVA_STATES)) {
    if (!def) continue;
    if (seen[def.IIN]) {
      assert.fail(`Duplicate IIN ${def.IIN} shared by ${seen[def.IIN]} and ${code}`);
    }
    seen[def.IIN] = code;
  }
});

/* ============================================================
   AAMVA VERSION DEFINITIONS
   ============================================================ */

test("all versions have fields defined", () => {
  for (const [ver, def] of Object.entries(window.AAMVA_VERSIONS)) {
    assert.ok(def.name, `Version ${ver} should have a name`);
    assert.ok(Array.isArray(def.fields), `Version ${ver} should have fields array`);
    assert.ok(def.fields.length > 0, `Version ${ver} should have at least one field`);
  }
});

test("all fields have required properties", () => {
  for (const [ver, def] of Object.entries(window.AAMVA_VERSIONS)) {
    for (const field of def.fields) {
      assert.ok(field.code, `Field in ${ver} missing code`);
      assert.ok(field.label, `Field ${field.code} in ${ver} missing label`);
      assert.ok(field.type, `Field ${field.code} in ${ver} missing type`);
      assert.match(field.code, /^[A-Z]{2}[A-Z0-9]$/, `Field code ${field.code} should be 3 uppercase chars`);
    }
  }
});

/* ============================================================
   FIELD VALIDATION
   ============================================================ */

test("validateFieldValue accepts valid date YYYYMMDD", () => {
  const field = { code: "DBB", type: "date", required: true };
  assert.ok(window.validateFieldValue(field, "19900115"));
});

test("validateFieldValue rejects invalid date format", () => {
  const field = { code: "DBB", type: "date", required: true };
  assert.equal(window.validateFieldValue(field, "1990-01-15"), false);
  assert.equal(window.validateFieldValue(field, "199001"), false);
});

test("validateFieldValue accepts valid ZIP codes", () => {
  const field = { code: "DAK", type: "zip", required: true };
  assert.ok(window.validateFieldValue(field, "10001"));
  assert.ok(window.validateFieldValue(field, "10001-1234"));
});

test("validateFieldValue rejects invalid ZIP codes", () => {
  const field = { code: "DAK", type: "zip", required: true };
  assert.equal(window.validateFieldValue(field, "1234"), false);
  assert.equal(window.validateFieldValue(field, "ABCDE"), false);
});

test("validateFieldValue accepts digits for char type (AAMVA sex field)", () => {
  const field = { code: "DBC", type: "char", required: true };
  assert.ok(window.validateFieldValue(field, "1"), "Should accept '1' (male)");
  assert.ok(window.validateFieldValue(field, "2"), "Should accept '2' (female)");
  assert.ok(window.validateFieldValue(field, "9"), "Should accept '9' (not specified)");
});

test("validateFieldValue accepts uppercase letters for char type", () => {
  const field = { code: "DBC", type: "char", required: true };
  assert.ok(window.validateFieldValue(field, "M"));
  assert.ok(window.validateFieldValue(field, "F"));
});

test("validateFieldValue rejects empty required fields", () => {
  const field = { code: "DCS", type: "string", required: true };
  assert.equal(window.validateFieldValue(field, ""), false);
});

test("validateFieldValue allows empty optional fields", () => {
  const field = { code: "DAD", type: "string" };
  assert.ok(window.validateFieldValue(field, ""));
});

/* ============================================================
   PDF417 ENCODER
   ============================================================ */

test("PDF417.generate returns a 2D matrix", () => {
  const matrix = window.PDF417.generate("TEST");
  assert.ok(Array.isArray(matrix), "Should return an array");
  assert.ok(matrix.length > 0, "Should have rows");
  assert.ok(Array.isArray(matrix[0]), "Each row should be an array");
  assert.ok(matrix[0].length > 0, "Each row should have columns");
});

test("PDF417.generate matrix contains only 0s and 1s", () => {
  const matrix = window.PDF417.generate("HELLO");
  for (const row of matrix) {
    for (const bit of row) {
      assert.ok(bit === 0 || bit === 1, `Expected 0 or 1, got ${bit}`);
    }
  }
});

test("PDF417.raw returns byte array", () => {
  const raw = window.PDF417.raw("ABC");
  assert.deepEqual(raw, [65, 66, 67]);
});

test("PDF417.generateSVG returns SVG string and matrix", () => {
  const result = window.PDF417.generateSVG("TEST");
  assert.ok(result.svg, "Should have svg property");
  assert.ok(result.matrix, "Should have matrix property");
  assert.ok(result.svg.startsWith("<svg"), "SVG should start with <svg tag");
  assert.ok(result.svg.endsWith("</svg>"), "SVG should end with </svg>");
});

/* ============================================================
   AAMVA PAYLOAD GENERATION
   ============================================================ */

test("generateAAMVAPayload produces valid AAMVA header", () => {
  // Stub document.getElementById for buildPayloadObject
  const fields = window.getFieldsForVersion("09");
  const dataObj = { state: "NY", version: "09" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  // Fill required fields with test data
  dataObj.DAA = "VERA,SEAN";
  dataObj.DCS = "VERA";
  dataObj.DAC = "SEAN";
  dataObj.DBA = "20301231";
  dataObj.DBB = "19900101";
  dataObj.DBC = "1";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "NEW YORK";
  dataObj.DAJ = "NY";
  dataObj.DAK = "10001";
  dataObj.DAQ = "V12345678";

  const payload = window.generateAAMVAPayload("NY", "09", fields, dataObj);

  assert.ok(payload.startsWith("@"), "Should start with @ compliance indicator");
  assert.ok(payload.includes("ANSI "), "Should contain ANSI file type");
  assert.ok(payload.includes("636031"), "Should contain NY IIN");
  assert.ok(payload.includes("DL"), "Should contain DL subfile type");
});

test("generateAAMVAPayload includes field values", () => {
  const fields = window.getFieldsForVersion("09");
  const dataObj = { state: "CA", version: "09" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DAA = "DOE,JOHN";
  dataObj.DCS = "DOE";
  dataObj.DAC = "JOHN";
  dataObj.DBA = "20301231";
  dataObj.DBB = "19850515";
  dataObj.DBC = "1";
  dataObj.DAG = "456 OAK AVE";
  dataObj.DAI = "LOS ANGELES";
  dataObj.DAJ = "CA";
  dataObj.DAK = "90001";
  dataObj.DAQ = "D1234567";

  const payload = window.generateAAMVAPayload("CA", "09", fields, dataObj);

  assert.ok(payload.includes("DCSDOE"), "Should contain last name field");
  assert.ok(payload.includes("DACJOHN"), "Should contain first name field");
  assert.ok(payload.includes("DAQ" + "D1234567"), "Should contain license number");
});

/* ============================================================
   DECODER
   ============================================================ */

test("decoder handles AAMVA-format payloads", () => {
  const fields = window.getFieldsForVersion("09");
  const dataObj = { state: "NY", version: "09" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DCS = "VERA";
  dataObj.DAC = "SEAN";
  dataObj.DAA = "VERA,SEAN";
  dataObj.DBA = "20301231";
  dataObj.DBB = "19900101";
  dataObj.DBC = "1";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "NEW YORK";
  dataObj.DAJ = "NY";
  dataObj.DAK = "10001";
  dataObj.DAQ = "V12345678";

  const payload = window.generateAAMVAPayload("NY", "09", fields, dataObj);
  const result = window.AAMVA_DECODER.decode(payload);

  assert.ok(result.ok, "Should decode successfully");
  assert.equal(result.json.DCS, "VERA");
  assert.equal(result.json.DAC, "SEAN");
  assert.equal(result.json.version, "09");
});

test("decoder falls back to JSON for legacy format", () => {
  const json = JSON.stringify({ version: "09", DCS: "SMITH", DAC: "JANE" });
  const result = window.AAMVA_DECODER.decode(json);
  assert.ok(result.ok, "Should decode JSON successfully");
  assert.equal(result.json.DCS, "SMITH");
});

test("decoder returns error for invalid input", () => {
  const result = window.AAMVA_DECODER.decode("not valid at all {{{");
  assert.ok(result.error, "Should return an error");
});

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

test("getFieldsForVersion returns fields for valid version", () => {
  const fields = window.getFieldsForVersion("08");
  assert.ok(fields.length > 0);
  assert.ok(fields.some(f => f.code === "DCS"));
});

test("getFieldsForVersion returns empty for unknown version", () => {
  const fields = window.getFieldsForVersion("99");
  assert.deepEqual(fields, []);
});

test("describeVersion returns formatted string", () => {
  const desc = window.describeVersion("09");
  assert.ok(desc.includes("2009"));
  assert.ok(desc.includes("DAA"));
});

test("describeVersion returns message for unknown version", () => {
  const desc = window.describeVersion("99");
  assert.equal(desc, "Unknown version");
});

/* ============================================================
   VERSION 2020 HEADER ENCODING
   ============================================================ */

test("version 2020 has headerVersion property set to '10'", () => {
  const def = window.AAMVA_VERSIONS["2020"];
  assert.ok(def, "Version 2020 should exist");
  assert.equal(def.headerVersion, "10", "Should use version 10 in header");
});

test("generateAAMVAPayload emits 2-char version for version 2020", () => {
  const fields = window.getFieldsForVersion("2020");
  const dataObj = { state: "CA", version: "2020" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DCA = "C";
  dataObj.DCB = "NONE";
  dataObj.DCD = "NONE";
  dataObj.DBA = "20301231";
  dataObj.DCS = "DOE";
  dataObj.DAC = "JOHN";
  dataObj.DBB = "19850515";
  dataObj.DBC = "1";
  dataObj.DAY = "BRO";
  dataObj.DAU = "510";
  dataObj.DAG = "456 OAK AVE";
  dataObj.DAI = "LOS ANGELES";
  dataObj.DAJ = "CA";
  dataObj.DAK = "90001";
  dataObj.DAQ = "D1234567";
  dataObj.DCF = "00000000";
  dataObj.DCG = "USA";

  const payload = window.generateAAMVAPayload("CA", "2020", fields, dataObj);

  // Header: @\n\x1e\rANSI  + IIN(6) + version(2) + jurisVersion(2)
  // Version in header should be "10" (2 chars), not "2020" (4 chars)
  const headerVersion = payload.substring(15, 17);
  assert.equal(headerVersion, "10", "Header should contain version '10', not '2020'");

  // Total header before numEntries should be exactly 19 chars
  // @(1) + \n(1) + \x1e(1) + \r(1) + "ANSI "(5) + IIN(6) + ver(2) + jver(2) = 19
  const fileType = payload.substring(4, 9);
  assert.equal(fileType, "ANSI ", "File type should be 'ANSI '");
});

test("decoder round-trips version 2020 payloads", () => {
  const fields = window.getFieldsForVersion("2020");
  const dataObj = { state: "NY", version: "2020" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DCA = "D";
  dataObj.DCB = "NONE";
  dataObj.DCD = "NONE";
  dataObj.DBA = "20301231";
  dataObj.DCS = "SMITH";
  dataObj.DAC = "JANE";
  dataObj.DBB = "19900101";
  dataObj.DBC = "2";
  dataObj.DAY = "BLU";
  dataObj.DAU = "504";
  dataObj.DAG = "789 ELM ST";
  dataObj.DAI = "BUFFALO";
  dataObj.DAJ = "NY";
  dataObj.DAK = "14201";
  dataObj.DAQ = "S9876543";
  dataObj.DCF = "11111111";
  dataObj.DCG = "USA";

  const payload = window.generateAAMVAPayload("NY", "2020", fields, dataObj);
  const result = window.AAMVA_DECODER.decode(payload);

  assert.ok(result.ok, "Should decode successfully");
  assert.equal(result.json.DCS, "SMITH");
  assert.equal(result.json.DAC, "JANE");
  // Decoder extracts the header version "10", not the key "2020"
  assert.equal(result.json.version, "10");
});

/* ============================================================
   PAYLOAD HEADER STRUCTURE
   ============================================================ */

test("payload header has correct fixed-length structure", () => {
  const fields = window.getFieldsForVersion("09");
  const dataObj = { state: "NY", version: "09" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DAA = "TEST";
  dataObj.DCS = "TEST";
  dataObj.DAC = "TEST";
  dataObj.DBA = "20301231";
  dataObj.DBB = "19900101";
  dataObj.DBC = "1";
  dataObj.DAG = "123 MAIN";
  dataObj.DAI = "CITY";
  dataObj.DAJ = "NY";
  dataObj.DAK = "10001";
  dataObj.DAQ = "L12345";

  const payload = window.generateAAMVAPayload("NY", "09", fields, dataObj);

  // Verify header offsets
  assert.equal(payload.charAt(0), "@", "Byte 0: compliance indicator");
  assert.equal(payload.charAt(1), "\n", "Byte 1: data element separator");
  assert.equal(payload.charAt(2), "\x1e", "Byte 2: record separator");
  assert.equal(payload.charAt(3), "\r", "Byte 3: segment terminator");
  assert.equal(payload.substring(4, 9), "ANSI ", "Bytes 4-8: file type");
  assert.equal(payload.substring(9, 15), "636031", "Bytes 9-14: NY IIN");
  assert.equal(payload.substring(15, 17), "09", "Bytes 15-16: version");
});
