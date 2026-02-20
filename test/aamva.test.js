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
