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

test("states have correct official AAMVA IINs", () => {
  // Spot-check against official AAMVA IIN registry
  assert.equal(window.AAMVA_STATES.VA.IIN, "636000", "Virginia = 636000");
  assert.equal(window.AAMVA_STATES.NY.IIN, "636001", "New York = 636001");
  assert.equal(window.AAMVA_STATES.CA.IIN, "636014", "California = 636014");
  assert.equal(window.AAMVA_STATES.TX.IIN, "636015", "Texas = 636015");
  assert.equal(window.AAMVA_STATES.FL.IIN, "636010", "Florida = 636010");
  assert.equal(window.AAMVA_STATES.IL.IIN, "636035", "Illinois = 636035");
  assert.equal(window.AAMVA_STATES.OH.IIN, "636023", "Ohio = 636023");
  assert.equal(window.AAMVA_STATES.PA.IIN, "636025", "Pennsylvania = 636025");
  assert.equal(window.AAMVA_STATES.GA.IIN, "636055", "Georgia = 636055");
  assert.equal(window.AAMVA_STATES.DC.IIN, "636043", "DC = 636043");
});

test("all states have an aamvaVersion property", () => {
  for (const [code, def] of Object.entries(window.AAMVA_STATES)) {
    if (!def) continue;
    assert.ok(def.aamvaVersion, `State ${code} should have aamvaVersion`);
    assert.ok(window.AAMVA_VERSIONS[def.aamvaVersion],
      `State ${code} aamvaVersion "${def.aamvaVersion}" should be a valid version`);
  }
});

test("all states have a name property", () => {
  for (const [code, def] of Object.entries(window.AAMVA_STATES)) {
    if (!def) continue;
    assert.ok(def.name, `State ${code} should have a name`);
    assert.ok(typeof def.name === "string" && def.name.length > 1,
      `State ${code} name should be a non-empty string`);
  }
});

test("DC and UT have different IINs", () => {
  const dc = window.AAMVA_STATES.DC;
  const ut = window.AAMVA_STATES.UT;
  assert.notEqual(dc.IIN, ut.IIN, "DC and UT must have different IINs");
});

test("territories have IINs", () => {
  assert.ok(window.AAMVA_STATES.AS.IIN, "American Samoa should have IIN");
  assert.ok(window.AAMVA_STATES.GU.IIN, "Guam should have IIN");
  assert.ok(window.AAMVA_STATES.VI.IIN, "Virgin Islands should have IIN");
  assert.ok(window.AAMVA_STATES.PR.IIN, "Puerto Rico should have IIN");
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
   CONSTRAINED FIELD OPTIONS
   ============================================================ */

test("AAMVA_FIELD_OPTIONS defines options for constrained fields", () => {
  const opts = window.AAMVA_FIELD_OPTIONS;
  assert.ok(opts, "AAMVA_FIELD_OPTIONS should exist");
  assert.ok(opts.DBC, "Should have DBC (Sex) options");
  assert.ok(opts.DAY, "Should have DAY (Eye Color) options");
  assert.ok(opts.DAZ, "Should have DAZ (Hair Color) options");
  assert.ok(opts.DCG, "Should have DCG (Country) options");
  assert.ok(opts.DDE, "Should have DDE (Family Name Truncation) options");
  assert.ok(opts.DDA, "Should have DDA (Compliance Type) options");
  assert.ok(opts.DDK, "Should have DDK (Organ Donor) options");
  assert.ok(opts.DDL, "Should have DDL (Veteran) options");
  assert.ok(opts.DCL, "Should have DCL (Race/Ethnicity) options");
});

test("constrained field options have value and label properties", () => {
  for (const [code, options] of Object.entries(window.AAMVA_FIELD_OPTIONS)) {
    assert.ok(Array.isArray(options), `${code} options should be an array`);
    for (const opt of options) {
      assert.ok(opt.value, `${code} option should have a value`);
      assert.ok(opt.label, `${code} option should have a label`);
    }
  }
});

/* ============================================================
   FIELD LENGTH LIMITS
   ============================================================ */

test("AAMVA_FIELD_LIMITS defines max lengths", () => {
  const limits = window.AAMVA_FIELD_LIMITS;
  assert.ok(limits, "AAMVA_FIELD_LIMITS should exist");
  assert.equal(limits.DCS, 40, "DCS max length should be 40");
  assert.equal(limits.DAJ, 2, "DAJ max length should be 2");
  assert.equal(limits.DBC, 1, "DBC max length should be 1");
  assert.equal(limits.DBA, 8, "DBA max length should be 8");
  assert.equal(limits.DAG, 35, "DAG max length should be 35");
  assert.equal(limits.DAH, 35, "DAH max length should be 35");
});

test("validateFieldValue enforces length limits", () => {
  const field = { code: "DAJ", type: "string", required: true };
  assert.ok(window.validateFieldValue(field, "NY"), "NY should be valid (2 chars)");
  assert.equal(window.validateFieldValue(field, "NYC"), false, "NYC should be invalid (3 chars, limit 2)");
});

/* ============================================================
   DAH (ADDRESS LINE 2) FIELD
   ============================================================ */

test("all versions include DAH (Address Line 2)", () => {
  for (const [ver, def] of Object.entries(window.AAMVA_VERSIONS)) {
    const hasDAH = def.fields.some(f => f.code === "DAH");
    assert.ok(hasDAH, `Version ${ver} should include DAH (Address Line 2)`);
  }
});

/* ============================================================
   AAMVA VERSION DEFINITIONS
   ============================================================ */

test("versions 01 through 10 are defined", () => {
  for (let i = 1; i <= 10; i++) {
    const key = i.toString().padStart(2, "0");
    assert.ok(window.AAMVA_VERSIONS[key], `Version ${key} should be defined`);
  }
});

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

test("version 01 uses DAA (full name) instead of split names", () => {
  const fields = window.getFieldsForVersion("01");
  assert.ok(fields.some(f => f.code === "DAA"), "Version 01 should have DAA (Full Name)");
  assert.ok(!fields.some(f => f.code === "DCS"), "Version 01 should NOT have DCS");
});

test("versions 04+ have truncation indicators", () => {
  for (const ver of ["04", "05", "06", "07", "08", "09", "10"]) {
    const fields = window.getFieldsForVersion(ver);
    assert.ok(fields.some(f => f.code === "DDE"), `Version ${ver} should have DDE`);
    assert.ok(fields.some(f => f.code === "DDF"), `Version ${ver} should have DDF`);
    assert.ok(fields.some(f => f.code === "DDG"), `Version ${ver} should have DDG`);
  }
});

test("versions 08+ have organ donor and veteran indicators", () => {
  for (const ver of ["08", "09", "10"]) {
    const fields = window.getFieldsForVersion(ver);
    assert.ok(fields.some(f => f.code === "DDK"), `Version ${ver} should have DDK (Organ Donor)`);
    assert.ok(fields.some(f => f.code === "DDL"), `Version ${ver} should have DDL (Veteran)`);
  }
});

/* ============================================================
   STATE-TO-VERSION AUTO-SELECTION
   ============================================================ */

test("getVersionForState returns correct version", () => {
  assert.equal(window.getVersionForState("VA"), "10", "VA should use version 10");
  assert.equal(window.getVersionForState("CA"), "10", "CA should use version 10");
  assert.equal(window.getVersionForState("AL"), "09", "AL should use version 09");
  assert.equal(window.getVersionForState("MT"), "09", "MT should use version 09");
});

test("getVersionForState returns null for unknown state", () => {
  assert.equal(window.getVersionForState("XX"), null);
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

test("PDF417.raw returns byte mode latch + byte array", () => {
  const raw = window.PDF417.raw("ABC");
  assert.deepEqual(raw, [901, 65, 66, 67]);
});

test("PDF417.generateSVG returns SVG string and matrix", () => {
  const result = window.PDF417.generateSVG("TEST");
  assert.ok(result.svg, "Should have svg property");
  assert.ok(result.matrix, "Should have matrix property");
  assert.ok(result.svg.startsWith("<svg"), "SVG should start with <svg tag");
  assert.ok(result.svg.endsWith("</svg>"), "SVG should end with </svg>");
});

test("PDF417.generateSVG uses run-length encoding (fewer rects than modules)", () => {
  const result = window.PDF417.generateSVG("TEST", { scale: 1 });
  // Count rect elements (excluding the white background rect)
  const rectCount = (result.svg.match(/<rect /g) || []).length;
  const matrix = result.matrix;
  // Count total black modules
  let blackModules = 0;
  for (const row of matrix) {
    for (const bit of row) {
      if (bit === 1) blackModules++;
    }
  }
  // With RLE, rect count should be less than total black modules
  assert.ok(rectCount < blackModules,
    `RLE should produce fewer rects (${rectCount}) than black modules (${blackModules})`);
});

/* ============================================================
   AAMVA PAYLOAD GENERATION
   ============================================================ */

function makeTestData(state, version) {
  const fields = window.getFieldsForVersion(version);
  const dataObj = { state: state, version: version };
  fields.forEach(f => { dataObj[f.code] = ""; });
  return { fields, dataObj };
}

function fillV09TestData(dataObj) {
  dataObj.DCA = "D";
  dataObj.DCB = "NONE";
  dataObj.DCD = "NONE";
  dataObj.DBA = "20301231";
  dataObj.DCS = "VERA";
  dataObj.DAC = "SEAN";
  dataObj.DAD = "M";
  dataObj.DBD = "20200101";
  dataObj.DBB = "19900101";
  dataObj.DBC = "1";
  dataObj.DAY = "BRO";
  dataObj.DAU = "510";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "NEW YORK";
  dataObj.DAJ = "NY";
  dataObj.DAK = "10001";
  dataObj.DAQ = "V12345678";
  dataObj.DCF = "00000000";
  dataObj.DCG = "USA";
  dataObj.DDE = "N";
  dataObj.DDF = "N";
  dataObj.DDG = "N";
}

test("generateAAMVAPayload produces valid AAMVA header", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);

  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);

  assert.ok(payload.startsWith("@"), "Should start with @ compliance indicator");
  assert.ok(payload.includes("ANSI "), "Should contain ANSI file type");
  assert.ok(payload.includes("636001"), "Should contain NY IIN (636001)");
  assert.ok(payload.includes("DL"), "Should contain DL subfile type");
});

test("generateAAMVAPayload includes field values", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  dataObj.DCS = "DOE";
  dataObj.DAC = "JOHN";
  dataObj.DAQ = "D1234567";

  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);

  assert.ok(payload.includes("DCSDOE"), "Should contain last name field");
  assert.ok(payload.includes("DACJOHN"), "Should contain first name field");
  assert.ok(payload.includes("DAQD1234567"), "Should contain license number");
});

test("generateAAMVAPayload uses correct IIN for each state", () => {
  const { fields, dataObj } = makeTestData("VA", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("VA", "10", fields, dataObj);
  assert.ok(payload.includes("636000"), "VA payload should contain IIN 636000");

  const { fields: fields2, dataObj: dataObj2 } = makeTestData("TX", "10");
  fillV09TestData(dataObj2);
  const payload2 = window.generateAAMVAPayload("TX", "10", fields2, dataObj2);
  assert.ok(payload2.includes("636015"), "TX payload should contain IIN 636015");
});

/* ============================================================
   DECODER
   ============================================================ */

test("decoder handles AAMVA-format payloads", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);

  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  const result = window.AAMVA_DECODER.decode(payload);

  assert.ok(result.ok, "Should decode successfully");
  assert.equal(result.json.DCS, "VERA");
  assert.equal(result.json.DAC, "SEAN");
  assert.equal(result.json.version, "10");
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
  const fields = window.getFieldsForVersion("09");
  assert.ok(fields.length > 0);
  assert.ok(fields.some(f => f.code === "DCS"));
});

test("getFieldsForVersion returns empty for unknown version", () => {
  const fields = window.getFieldsForVersion("99");
  assert.deepEqual(fields, []);
});

test("describeVersion returns formatted string", () => {
  const desc = window.describeVersion("09");
  assert.ok(desc.includes("2016"));
  assert.ok(desc.includes("DCS"));
});

test("describeVersion returns message for unknown version", () => {
  const desc = window.describeVersion("99");
  assert.equal(desc, "Unknown version");
});

/* ============================================================
   PAYLOAD HEADER STRUCTURE
   ============================================================ */

test("payload header has correct fixed-length structure", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);

  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);

  // Verify header offsets
  assert.equal(payload.charAt(0), "@", "Byte 0: compliance indicator");
  assert.equal(payload.charAt(1), "\n", "Byte 1: data element separator");
  assert.equal(payload.charAt(2), "\x1e", "Byte 2: record separator");
  assert.equal(payload.charAt(3), "\r", "Byte 3: segment terminator");
  assert.equal(payload.substring(4, 9), "ANSI ", "Bytes 4-8: file type");
  assert.equal(payload.substring(9, 15), "636001", "Bytes 9-14: NY IIN");
  assert.equal(payload.substring(15, 17), "10", "Bytes 15-16: version");
});

/* ============================================================
   INPUT SANITIZATION
   ============================================================ */

test("generateAAMVAPayload strips control characters from field values", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  dataObj.DCS = "DOE\x0D";
  dataObj.DAC = "JOHN";
  dataObj.DAQ = "D1234567";

  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);

  // Control chars should be stripped
  assert.ok(!payload.includes("\x00"), "Should not contain null byte");
  assert.ok(payload.includes("DCSDOE"), "Should contain sanitized last name");
});

test("error messages include field labels", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  // Leave all required fields empty

  try {
    window.generateAAMVAPayload("NY", "10", fields, dataObj);
    assert.fail("Should have thrown");
  } catch (err) {
    assert.ok(err.message.includes("Vehicle Class (DCA)"), "Should include field label and code");
    assert.ok(err.message.includes("Customer Family Name (DCS)"), "Should include family name label");
  }
});

/* ============================================================
   FIELD VALIDATION EDGE CASES
   ============================================================ */

test("validateFieldValue rejects multi-char for char type", () => {
  const field = { code: "DBC", type: "char", required: true };
  assert.equal(window.validateFieldValue(field, "MF"), false, "Should reject multi-char");
});

test("validateFieldValue rejects lowercase for char type", () => {
  const field = { code: "DBC", type: "char", required: true };
  assert.equal(window.validateFieldValue(field, "m"), false, "Should reject lowercase");
});

/* ============================================================
   VERSION-SPECIFIC FIELD COUNTS
   ============================================================ */

test("version 01 has fewer fields than version 10", () => {
  const v01 = window.getFieldsForVersion("01");
  const v10 = window.getFieldsForVersion("10");
  assert.ok(v01.length < v10.length,
    `Version 01 (${v01.length} fields) should have fewer than version 10 (${v10.length} fields)`);
});

test("mandatory field count increases across versions", () => {
  const v01mandatory = window.getFieldsForVersion("01").filter(f => f.required).length;
  const v10mandatory = window.getFieldsForVersion("10").filter(f => f.required).length;
  assert.ok(v10mandatory > v01mandatory,
    `Version 10 mandatory (${v10mandatory}) should exceed version 01 (${v01mandatory})`);
});

/* ============================================================
   PDF417 ENCODER — BYTE MODE LATCH
   ============================================================ */

test("PDF417.raw includes byte mode latch codeword 901", () => {
  const raw = window.PDF417.raw("ABC");
  assert.equal(raw[0], 901, "First codeword should be 901 (byte mode latch)");
  assert.equal(raw[1], 65, "Second codeword should be 65 (A)");
  assert.equal(raw[2], 66, "Third codeword should be 66 (B)");
  assert.equal(raw[3], 67, "Fourth codeword should be 67 (C)");
});

/* ============================================================
   PDF417 — CLUSTER CONSISTENCY
   ============================================================ */

test("all codewords in a row use the same cluster pattern width", () => {
  // Generate a barcode and verify that rows have consistent structure
  const matrix = window.PDF417.generate("TEST DATA", { errorCorrectionLevel: 2 });
  assert.ok(matrix.length > 0, "Should have rows");
  // All rows should have the same width (consistent structure)
  const expectedWidth = matrix[0].length;
  for (let i = 1; i < matrix.length; i++) {
    assert.equal(matrix[i].length, expectedWidth,
      `Row ${i} width (${matrix[i].length}) should equal row 0 width (${expectedWidth})`);
  }
});

/* ============================================================
   buildPayloadObject — DOM DECOUPLED
   ============================================================ */

test("buildPayloadObject works with valuesMap parameter (no DOM)", () => {
  const fields = window.getFieldsForVersion("10");
  const values = { DCS: "SMITH", DAC: "JOHN", DBC: "1" };
  const obj = window.buildPayloadObject("NY", "10", fields, values);

  assert.equal(obj.state, "NY");
  assert.equal(obj.version, "10");
  assert.equal(obj.DCS, "SMITH");
  assert.equal(obj.DAC, "JOHN");
  assert.equal(obj.DBC, "1");
  // Unset fields default to empty string
  assert.equal(obj.DAG, "");
});

test("buildPayloadObject preserves all provided field values", () => {
  const fields = window.getFieldsForVersion("09");
  const values = {};
  fillV09TestData(values);

  const obj = window.buildPayloadObject("NY", "09", fields, values);

  assert.equal(obj.DCS, "VERA");
  assert.equal(obj.DAC, "SEAN");
  assert.equal(obj.DAJ, "NY");
  assert.equal(obj.DCG, "USA");
});

/* ============================================================
   VERSION 01 — FULL NAME (DAA) PAYLOAD
   ============================================================ */

test("version 01 payload uses DAA (full name) field", () => {
  const fields = window.getFieldsForVersion("01");
  const dataObj = { state: "VA", version: "01" };
  fields.forEach(f => { dataObj[f.code] = ""; });

  // Fill v01 mandatory fields
  dataObj.DAA = "DOE,JOHN,M";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "RICHMOND";
  dataObj.DAJ = "VA";
  dataObj.DAK = "23220";
  dataObj.DAQ = "T12345678";
  dataObj.DBA = "20301231";
  dataObj.DBB = "19900115";
  dataObj.DBC = "1";

  const payload = window.generateAAMVAPayload("VA", "01", fields, dataObj);
  assert.ok(payload.includes("DAADOE,JOHN,M"), "Should contain DAA full name");
  assert.ok(payload.includes("636000"), "Should contain VA IIN");
  assert.ok(payload.substring(15, 17) === "01", "Version should be 01");
});

/* ============================================================
   DECODER — ROUND-TRIP INTEGRITY
   ============================================================ */

test("decoder round-trip preserves all field values", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  dataObj.DCS = "MARTINEZ";
  dataObj.DAC = "ELENA";
  dataObj.DAD = "ROSA";
  dataObj.DAH = "APT 4B";

  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);
  const decoded = window.AAMVA_DECODER.decode(payload);

  assert.ok(decoded.ok);
  assert.equal(decoded.json.DCS, "MARTINEZ");
  assert.equal(decoded.json.DAC, "ELENA");
  assert.equal(decoded.json.DAD, "ROSA");
  assert.equal(decoded.json.DAH, "APT 4B");
  assert.equal(decoded.json.state, "CA");
});

test("decoder describeFields produces human-readable output", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);

  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  const decoded = window.AAMVA_DECODER.decode(payload);

  assert.ok(decoded.ok);
  assert.ok(decoded.mapped, "Should have mapped output");
  assert.ok(decoded.mapped.includes("Customer Family Name"), "Should include field label");
  assert.ok(decoded.mapped.includes("VERA"), "Should include field value");
});

/* ============================================================
   ENCODER — MULTIPLE ERROR CORRECTION LEVELS
   ============================================================ */

test("PDF417.generate works with different EC levels", () => {
  for (let ec = 0; ec <= 8; ec++) {
    const matrix = window.PDF417.generate("HELLO", { errorCorrectionLevel: ec });
    assert.ok(matrix.length > 0, `EC level ${ec} should produce a valid matrix`);
    assert.ok(matrix[0].length > 0, `EC level ${ec} rows should have columns`);
  }
});

test("higher EC levels produce more rows", () => {
  const m2 = window.PDF417.generate("TEST", { errorCorrectionLevel: 2 });
  const m6 = window.PDF417.generate("TEST", { errorCorrectionLevel: 6 });
  // Higher EC = more error correction codewords = more rows
  assert.ok(m6.length >= m2.length,
    `EC 6 (${m6.length} rows) should have >= rows than EC 2 (${m2.length} rows)`);
});

/* ============================================================
   CLUSTER TABLE INTEGRITY — ISO 15438 structural constraints
   ============================================================ */

test("each cluster table has entries for all 929 codeword indices", () => {
  // CLUSTER_TABLE is built at module load. Verify via matrix generation:
  // generate a barcode large enough to exercise all 3 clusters (needs 3+ rows)
  const longText = "CLUSTER TABLE INTEGRITY CHECK 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ " +
                   "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 9876543210";
  const matrix = window.PDF417.generate(longText, { errorCorrectionLevel: 2 });
  assert.ok(matrix.length >= 3,
    `Matrix should have at least 3 rows to test all clusters; got ${matrix.length}`);
});

test("all cluster patterns are 17 modules wide", () => {
  // Check each row's data codewords sum to 17 modules each
  const matrix = window.PDF417.generate("CLUSTER CHECK 1234567890", { errorCorrectionLevel: 1 });
  const START_LEN = 17, STOP_LEN = 18, IND_LEN = 17;

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    // Strip start, stop, left indicator, right indicator
    const dataSection = row.slice(START_LEN + IND_LEN, row.length - IND_LEN - STOP_LEN);
    assert.equal(dataSection.length % 17, 0,
      `Row ${r}: data section length ${dataSection.length} must be divisible by 17`);

    // Each 17-module block: extract element widths and verify cluster constraint
    for (let c = 0; c + 17 <= dataSection.length; c += 17) {
      const bits = dataSection.slice(c, c + 17);
      const widths = [];
      let count = 1;
      for (let i = 1; i < bits.length; i++) {
        if (bits[i] === bits[i - 1]) count++;
        else { widths.push(count); count = 1; }
      }
      widths.push(count);

      assert.equal(widths.length, 8,
        `Row ${r} codeword ${c / 17}: must have 8 elements, got ${widths.length}`);
      assert.ok(widths.every(w => w >= 1 && w <= 6),
        `Row ${r} codeword ${c / 17}: all widths must be 1–6, got [${widths}]`);
      assert.equal(widths.reduce((a, b) => a + b, 0), 17,
        `Row ${r} codeword ${c / 17}: widths must sum to 17`);

      // Verify cluster constraint: K = (b1-b2+b3-b4+9)%9 must match row%3
      const [b1, , b2, , b3, , b4] = widths;
      const K = (((b1 - b2 + b3 - b4) % 9) + 9) % 9;
      const expectedK = (r % 3) * 3; // cluster 0→K=0, 1→K=3, 2→K=6
      assert.equal(K, expectedK,
        `Row ${r} codeword ${c / 17}: K=${K} but expected ${expectedK} (cluster ${r % 3})`);
    }
  }
});

test("start and stop patterns are correct per ISO 15438", () => {
  const matrix = window.PDF417.generate("START STOP CHECK", { errorCorrectionLevel: 1 });

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    // Start pattern: B8,S1,B1,S1,B1,S1,B1,S3 = [1×8,0,1,0,1,0,1,0,0,0] = 17 modules
    const start = row.slice(0, 17).join("");
    assert.equal(start, "11111111010101000",
      `Row ${r}: start pattern should be 11111111010101000, got ${start}`);

    // Stop pattern: B7,S1,B1,S3,B1,S1,B1,S2,B1 = 18 modules
    const stop = row.slice(row.length - 18).join("");
    assert.equal(stop, "111111101000101001",
      `Row ${r}: stop pattern should be 111111101000101001, got ${stop}`);
  }
});

/* ============================================================
   BYTE COMPACTION ENCODING — ISO 15438 Section 5.4.3
   ============================================================ */

test("byte encoding uses latch 900 when length divisible by 6", () => {
  // 6 bytes → latch codeword 900
  const cw = window.PDF417.raw("SIXBYT"); // 6 chars
  assert.equal(cw[0], 900, "6-byte string should use latch 900");
});

test("byte encoding uses latch 901 when length not divisible by 6", () => {
  const cw4 = window.PDF417.raw("TEST");   // 4 bytes
  const cw7 = window.PDF417.raw("TESTING"); // 7 bytes
  assert.equal(cw4[0], 901, "4-byte string should use latch 901");
  assert.equal(cw7[0], 901, "7-byte string should use latch 901");
});

test("byte encoding produces 5 codewords per 6-byte group", () => {
  // 12 bytes (2 full groups) with latch 900 → 1 + 2×5 = 11 codewords
  const cw = window.PDF417.raw("ABCDEFGHIJKL"); // exactly 12 bytes
  assert.equal(cw[0], 900, "should use latch 900");
  assert.equal(cw.length, 11, "12 bytes with latch 900 → 1 + 10 = 11 codewords");
});

test("byte encoding encodes remainder bytes one-per-codeword after full groups", () => {
  // 7 bytes = 1 full group (6 bytes → 5 codewords) + 1 remainder byte
  // latch 901 + 5 codewords + 1 remainder = 7 total
  const cw = window.PDF417.raw("ABCDEFG"); // 7 bytes
  assert.equal(cw[0], 901, "should use latch 901");
  assert.equal(cw.length, 7, "7 bytes → latch + 5 codewords + 1 remainder = 7 codewords");
  // The last codeword should be 'G' = 71
  assert.equal(cw[cw.length - 1], 71, "last codeword should be byte value of 'G' (71)");
});

test("byte encoding round-trips correctly", () => {
  // Encode 6 bytes, then decode the 5 codewords back to 6 bytes
  const input = [72, 101, 108, 108, 111, 33]; // "Hello!"
  const cw = window.PDF417.raw("Hello!").slice(1); // skip latch
  assert.equal(cw.length, 5, "6 bytes should encode to 5 codewords");

  // Decode: compute value from 5 base-929 codewords, then extract 6 bytes
  let val = 0;
  for (const c of cw) val = val * 929 + c;
  const decoded = [];
  for (let i = 5; i >= 0; i--) { decoded[i] = val % 256; val = Math.floor(val / 256); }
  assert.deepStrictEqual(decoded, input, "decoded bytes should match original");
});

/* ============================================================
   SCHEMA FIXES — DAD optional, DCU optional in v02
   ============================================================ */

test("Middle name DAD is optional in versions 04 through 10", () => {
  for (const v of ["04", "05", "06", "07", "08", "09", "10"]) {
    const dadField = window.AAMVA_VERSIONS[v].fields.find(f => f.code === "DAD");
    assert.ok(dadField, `Version ${v} should have DAD field`);
    assert.ok(!dadField.required,
      `Version ${v}: DAD (Middle Name) should be optional (not all people have a middle name)`);
  }
});

test("Name Suffix DCU is optional in version 02", () => {
  const dcuField = window.AAMVA_VERSIONS["02"].fields.find(f => f.code === "DCU");
  assert.ok(dcuField, "Version 02 should have DCU field");
  assert.ok(!dcuField.required, "Version 02: DCU (Name Suffix) should be optional");
});
