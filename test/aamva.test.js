const { test } = require("node:test");
const assert = require("node:assert/strict");
// Minimal browser global shim for loading the source files
global.window = global;
// Load source modules (they attach to window.*)
global.bwipjs = require("bwip-js");
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
test("territories are marked unsupported for generation", () => {
  assert.equal(window.isJurisdictionSupported("AS"), false);
  assert.equal(window.isJurisdictionSupported("GU"), false);
  assert.equal(window.isJurisdictionSupported("VI"), false);
  assert.equal(window.isJurisdictionSupported("PR"), false);
  assert.equal(window.isJurisdictionSupported("CA"), true);
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
test("validateFieldValue accepts valid date MMDDYYYY", () => {
  const field = { code: "DBB", type: "date", required: true };
  // AAMVA CDS mandates MMDDYYYY: January 15, 1990 = 01151990
  assert.ok(window.validateFieldValue(field, "01151990"));
});
test("validateFieldValue rejects non-MMDDYYYY date formats for standard versions", () => {
  const field = { code: "DBB", type: "date", required: true };
  // Hyphenated ISO format — not 8 digits
  assert.equal(window.validateFieldValue(field, "1990-01-15"), false);
  // Too short
  assert.equal(window.validateFieldValue(field, "199001"), false);
  // YYYYMMDD format must be rejected — barcode scanners parse dates as MMDDYYYY
  assert.equal(window.validateFieldValue(field, "19900115"), false, "YYYYMMDD must be rejected");
});

test("validateFieldValue enforces constrained option sets", () => {
  const sex = { code: "DBC", type: "char", required: true };
  assert.ok(window.validateFieldValue(sex, "1"), "DBC should accept enumerated value '1'");
  assert.equal(window.validateFieldValue(sex, "M"), false, "DBC should reject non-enumerated value 'M'");

  const eye = { code: "DAY", type: "string", required: false };
  assert.ok(window.validateFieldValue(eye, "BLU"), "DAY should accept BLU");
  assert.equal(window.validateFieldValue(eye, "BLUE"), false, "DAY should reject invalid eye color token");
});

test("validateFieldValue rejects impossible calendar dates", () => {
  const field = { code: "DBB", type: "date", required: true };
  // Feb 31 is invalid (MMDDYYYY)
  assert.equal(window.validateFieldValue(field, "02312024"), false, "MMDDYYYY Feb 31 should be invalid");
  // Month 13 is invalid
  assert.equal(window.validateFieldValue(field, "13012024"), false, "MMDDYYYY month 13 should be invalid");
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
test("validateFieldValue accepts uppercase letters for unconstrained char type", () => {
  const field = { code: "DCK", type: "char", required: true };
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
   PDF417 ENCODER (bwip-js)
   ============================================================ */
test("bwipjs.toSVG renders a PDF417 barcode as SVG", () => {
  const svg = window.bwipjs.toSVG({
    bcid: "pdf417",
    text: "TEST",
    columns: 4,
    eclevel: 2,
    compact: true,
    scale: 1
  });
  assert.ok(typeof svg === "string", "Should return SVG markup");
  assert.ok(svg.startsWith("<svg"), "SVG should start with <svg tag");
  assert.ok(svg.includes("<path"), "SVG should include rendered barcode paths");
  assert.ok(svg.trimEnd().endsWith("</svg>"), "SVG should end with </svg>");
});
test("bwipjs SVG output includes a positive viewBox", () => {
  const svg = window.bwipjs.toSVG({
    bcid: "pdf417",
    text: "HELLO",
    columns: 4,
    eclevel: 2,
    compact: true,
    scale: 1
  });
  const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  assert.ok(match, "SVG should include a viewBox with width and height");
  assert.ok(Number(match[1]) > 0, "viewBox width should be > 0");
  assert.ok(Number(match[2]) > 0, "viewBox height should be > 0");
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
  // All dates must be MMDDYYYY per the AAMVA CDS standard (V09/V10).
  dataObj.DBA = "12312030";  // December 31, 2030
  dataObj.DCS = "VERA";
  dataObj.DAC = "SEAN";
  dataObj.DAD = "M";
  dataObj.DBD = "01012020";  // January 1, 2020
  dataObj.DBB = "01011990";  // January 1, 1990
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
  // DCA is the first field in the subfile — previously silently dropped due to
  // a decoder bug where the directory "DL" was mistaken for the subfile start.
  assert.equal(result.json.DCA, "D", "First field DCA should be decoded (not silently dropped)");
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
test("generateAAMVAPayload rejects unknown state and version", () => {
  const fields = window.getFieldsForVersion("10");
  const dataObj = {
    DCS: "DOE", DAC: "JOHN", DBB: "19900115", DBA: "20300115", DBD: "20200115",
    DBC: "1", DAY: "BLU", DAU: "510", DAG: "123 MAIN ST", DAI: "ALBANY", DAJ: "NY",
    DAK: "12207", DAQ: "D1234567", DCF: "ABC123"
  };

  assert.throws(() => {
    window.generateAAMVAPayload("XX", "10", fields, dataObj);
  }, /Unknown state code/);

  assert.throws(() => {
    window.generateAAMVAPayload("NY", "99", fields, dataObj);
  }, /Unsupported AAMVA version/);
});

test("generateAAMVAPayload rejects unsupported territories", () => {
  const fields = window.getFieldsForVersion("09");
  const dataObj = {
    DCS: "DOE", DAC: "JOHN", DBC: "1", DAY: "BLU", DBB: "01011990",
    DBA: "01012030", DBD: "01012020", DAU: "510", DAG: "123 MAIN ST",
    DAI: "PAGO PAGO", DAJ: "AS", DAK: "96799", DAQ: "A12345",
    DCA: "D", DCB: "NONE", DCD: "NONE", DCF: "ABC123", DCG: "USA"
  };

  assert.throws(() => {
    window.generateAAMVAPayload("AS", "09", fields, dataObj);
  }, /Unsupported jurisdiction/);
});

test("validateAAMVAPayloadStructure accepts valid generated payload", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  const result = window.validateAAMVAPayloadStructure(payload);
  assert.deepEqual(result, { ok: true });
});

test("validateAAMVAPayloadStructure rejects malformed header tokens", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  const malformed = "#" + payload.substring(1);
  const result = window.validateAAMVAPayloadStructure(malformed);
  assert.equal(result.ok, false);
  assert.match(result.error, /Invalid compliance indicator/);
});

test("decoder rejects malformed directory offset/length", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  const badLengthPayload = payload.substring(0, 27) + "9999" + payload.substring(31);
  const decoded = window.AAMVA_DECODER.decode(badLengthPayload);
  assert.ok(decoded.error, "Decoder should return an error for inconsistent directory length");
});

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
test("generateAAMVAPayload normalizes non-ascii characters for byte-safe directory lengths", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  dataObj.DCS = "GARCÍA";
  dataObj.DAC = "JOSÉ";
  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);
  assert.ok(payload.includes("DCSGARCIA"), "Should transliterate accented surname");
  assert.ok(payload.includes("DACJOSE"), "Should transliterate accented given name");
});

test("generateDocumentDiscriminator returns uppercase alphanumeric token", () => {
  const discriminator = window.generateDocumentDiscriminator();
  assert.equal(discriminator.length, 12, "Default discriminator length should be 12");
  assert.match(discriminator, /^[A-Z2-9]+$/, "Should only include scanner-safe uppercase chars");
});

test("generateAAMVAPayload auto-generates DCF when requested", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  dataObj.DCF = "";

  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj, {
    autoGenerateDiscriminator: true
  });

  assert.ok(dataObj.DCF, "DCF should be populated when auto-generate is enabled");
  assert.match(dataObj.DCF, /^[A-Z2-9]+$/, "Generated DCF should be scanner-safe");
  assert.ok(payload.includes(`DCF${dataObj.DCF}`), "Payload should include generated DCF value");
});
test("generateAAMVAPayload directory length matches DL subfile bytes", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  const subfileDir = payload.substring(21, 31);
  const offset = Number.parseInt(subfileDir.substring(2, 6), 10);
  const length = Number.parseInt(subfileDir.substring(6, 10), 10);
  const dlData = payload.substring(offset, offset + length);
  assert.equal(offset, 31, "DL offset should match fixed single-directory header length");
  assert.equal(dlData.length, length, "DL subfile length should match declared directory length");
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
   PDF417 (bwip-js) — ERROR CORRECTION OPTIONS
   ============================================================ */
test("bwipjs accepts all supported PDF417 error correction levels", () => {
  for (let ec = 0; ec <= 8; ec++) {
    const svg = window.bwipjs.toSVG({
      bcid: "pdf417",
      text: "A",
      columns: 10,
      eclevel: ec,
      compact: true,
      scale: 1
    });
    assert.ok(svg.includes("<path"), `EC level ${ec} should render barcode paths`);
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
test("version 01 payload uses DAA (full name) field and correct formats", () => {
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

  // V01 uses YYYYMMDD and M/F sex code
  dataObj.DBA = "20301231"; // YYYYMMDD
  dataObj.DBB = "19900115"; // YYYYMMDD
  dataObj.DBC = "M";        // Male

  const payload = window.generateAAMVAPayload("VA", "01", fields, dataObj);
  const decoded = window.AAMVA_DECODER.decode(payload);

  assert.ok(decoded.ok, "v01 payload should decode");
  assert.equal(decoded.json.DAA, "DOE,JOHN,M", "v01 full name should survive round trip");
  assert.equal(decoded.json.DBB, "19900115", "DOB in YYYYMMDD should survive round trip");
  assert.equal(decoded.json.DBC, "M", "Sex M should survive");
});

test("validateFieldValue validates YYYYMMDD for version 01 fields", () => {
  // We need to fetch the actual field definition from Version 01 which has the dateFormat prop
  const v01fields = window.getFieldsForVersion("01");
  const dbb = v01fields.find(f => f.code === "DBB");

  assert.ok(dbb.dateFormat === "YYYYMMDD", "V01 DBB should have YYYYMMDD format");
  assert.ok(window.validateFieldValue(dbb, "19900115"), "Should accept YYYYMMDD");
  assert.equal(window.validateFieldValue(dbb, "01151990"), false, "Should reject MMDDYYYY for V01");
});

test("validateFieldValue accepts version-specific options (V01 Sex Code M/F)", () => {
  const v01fields = window.getFieldsForVersion("01");
  const dbc = v01fields.find(f => f.code === "DBC");

  assert.ok(window.validateFieldValue(dbc, "M"), "Should accept M");
  assert.ok(window.validateFieldValue(dbc, "F"), "Should accept F");
  assert.equal(window.validateFieldValue(dbc, "1"), false, "Should reject 1 for V01");
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
test("higher EC levels increase PDF417 symbol height in bwip-js output", () => {
  const svgEc2 = window.bwipjs.toSVG({ bcid: "pdf417", text: "TEST", columns: 4, eclevel: 2, compact: true, scale: 1 });
  const svgEc6 = window.bwipjs.toSVG({ bcid: "pdf417", text: "TEST", columns: 4, eclevel: 6, compact: true, scale: 1 });
  const h2 = Number(svgEc2.match(/viewBox="0 0 \d+ (\d+)"/)[1]);
  const h6 = Number(svgEc6.match(/viewBox="0 0 \d+ (\d+)"/)[1]);
  assert.ok(h6 >= h2, `EC 6 height (${h6}) should be >= EC 2 height (${h2})`);
});
/* ============================================================
   DATE FORMAT — MMDDYYYY ENFORCEMENT (CRITICAL FOR SCANNABILITY)
   AAMVA CDS requires MMDDYYYY for all date fields. Barcode scanners
   (police terminals, age verification hardware) interpret dates as
   MMDDYYYY. Encoding YYYYMMDD produces barcodes that real scanners
   will fail to read correctly.
   ============================================================ */
test("validateFieldValue accepts only MMDDYYYY format dates", () => {
  const field = { code: "DBB", type: "date", required: true };
  // Valid MMDDYYYY dates
  assert.ok(window.validateFieldValue(field, "01151990"), "Jan 15 1990 is valid MMDDYYYY");
  assert.ok(window.validateFieldValue(field, "12312030"), "Dec 31 2030 is valid MMDDYYYY");
  assert.ok(window.validateFieldValue(field, "02282000"), "Feb 28 2000 is valid MMDDYYYY");
  // YYYYMMDD must be rejected — month byte would read as 19, 20, etc. on scanners
  assert.equal(window.validateFieldValue(field, "19900115"), false, "19900115 (YYYYMMDD) must be rejected");
  assert.equal(window.validateFieldValue(field, "20301231"), false, "20301231 (YYYYMMDD) must be rejected");
  assert.equal(window.validateFieldValue(field, "20200101"), false, "20200101 (YYYYMMDD) must be rejected");
});
test("generateAAMVAPayload encodes dates in MMDDYYYY format", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);
  // DBB should contain the MMDDYYYY date, not YYYYMMDD
  assert.ok(payload.includes("DBB01011990"), "DBB field should use MMDDYYYY (01011990 = Jan 1 1990)");
  assert.ok(payload.includes("DBA12312030"), "DBA field should use MMDDYYYY (12312030 = Dec 31 2030)");
  assert.ok(!payload.includes("DBB19901"), "Payload must not contain YYYYMMDD date 19901...");
});
test("bwip-js renders AAMVA payload with MMDDYYYY dates without error", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  // If this throws, the payload is malformed for bwip-js
  const svg = window.bwipjs.toSVG({
    bcid: "pdf417",
    text: payload,
    columns: 10,
    eclevel: 5,
    compact: false,
    scale: 1
  });
  assert.ok(svg.includes("<path"), "Full AAMVA payload should render to PDF417 barcode");
});
/* ============================================================
   DAK POSTAL CODE — 11-CHARACTER PADDING
   AAMVA CDS requires DAK to be left-justified, space-padded to 11
   characters. Unpadded values may cause strict AAMVA scanners to
   fail field-length checks.
   ============================================================ */
test("generateAAMVAPayload pads 5-digit ZIP to 11 characters in DAK", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  dataObj.DAK = "10001";
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  // Should be padded to 11 chars: "10001      "
  assert.ok(payload.includes("DAK10001      "), "5-digit ZIP should be space-padded to 11 chars");
});
test("generateAAMVAPayload pads 9-digit ZIP (no hyphen) to 11 characters in DAK", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  dataObj.DAK = "100011234";
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  // 9 chars padded to 11: "100011234  "
  assert.ok(payload.includes("DAK100011234  "), "9-digit ZIP should be space-padded to 11 chars");
});
test("generateAAMVAPayload strips hyphen and pads ZIP+4 to 11 characters", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  dataObj.DAK = "10001-1234";
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  // Hyphen stripped, padded to 11: "100011234  "
  assert.ok(payload.includes("DAK100011234  "), "ZIP+4 with hyphen should be stripped and padded to 11 chars");
});
/* ============================================================
   MIDDLE NAME — OPTIONAL PER AAMVA CDS
   DAD is optional ("Required if available on the DL/ID"). Many
   real licenses omit the middle name field entirely.
   ============================================================ */
test("DAD (Middle Name) is optional in all versions 04 through 10", () => {
  for (const ver of ["04", "05", "06", "07", "08", "09", "10"]) {
    const fields = window.getFieldsForVersion(ver);
    const dad = fields.find(f => f.code === "DAD");
    assert.ok(dad, `Version ${ver} should include DAD field`);
    assert.ok(!dad.required, `Version ${ver} DAD should NOT be required (it is optional per AAMVA CDS)`);
  }
});
test("generateAAMVAPayload accepts versions 04+ without middle name", () => {
  const { fields, dataObj } = makeTestData("NY", "10");
  fillV09TestData(dataObj);
  dataObj.DAD = "";  // No middle name
  // Should not throw — middle name is optional
  const payload = window.generateAAMVAPayload("NY", "10", fields, dataObj);
  assert.ok(payload.includes("DCSVE"), "Should still include last name");
  assert.ok(!payload.includes("DAD\n"), "Empty DAD should be omitted from payload");
});
/* ============================================================
   NAME SUFFIX — OPTIONAL IN VERSION 02
   ============================================================ */
test("DCU (Name Suffix) is optional in version 02", () => {
  const fields = window.getFieldsForVersion("02");
  const dcu = fields.find(f => f.code === "DCU");
  assert.ok(dcu, "Version 02 should include DCU");
  assert.ok(!dcu.required, "Version 02 DCU should NOT be required");
});

/* ============================================================
   UPPERCASE & CONSISTENCY ENFORCEMENT
   ============================================================ */
test("generateAAMVAPayload enforces uppercase for string fields", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  dataObj.DCS = "smith"; // lowercase
  dataObj.DAC = "jane";  // lowercase
  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);
  assert.ok(payload.includes("DCSSMITH"), "DCS should be uppercase");
  assert.ok(payload.includes("DACJANE"), "DAC should be uppercase");
});

test("generateAAMVAPayload enforces DAJ matches state", () => {
  const { fields, dataObj } = makeTestData("CA", "10");
  fillV09TestData(dataObj);
  dataObj.DAJ = "NY"; // mismatched state
  const payload = window.generateAAMVAPayload("CA", "10", fields, dataObj);
  assert.ok(payload.includes("DAJCA"), "DAJ should be forced to match state (CA)");
});
/* ============================================================
   GENERATOR-LEVEL FIELD VALUE VALIDATION
   generateAAMVAPayload now validates field values (not just
   presence) after sanitization, catching spec violations that
   the UI layer would catch but programmatic callers might not.
   ============================================================ */
test("generateAAMVAPayload rejects invalid sex code for version 01 (must be M or F, not 1/2/9)", () => {
  const fields = window.getFieldsForVersion("01");
  const dataObj = { state: "VA", version: "01" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DAA = "DOE,JOHN,M";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "RICHMOND";
  dataObj.DAJ = "VA";
  dataObj.DAK = "23220";
  dataObj.DAQ = "T12345678";
  dataObj.DBA = "20301231"; // YYYYMMDD (correct for V01)
  dataObj.DBB = "19900115"; // YYYYMMDD (correct for V01)
  dataObj.DBC = "1";        // INVALID for V01 — numeric codes are for V02+

  assert.throws(() => {
    window.generateAAMVAPayload("VA", "01", fields, dataObj);
  }, /Invalid field values/, "Generator must reject numeric sex code for version 01");
});

test("generateAAMVAPayload rejects MMDDYYYY date format for version 01 (requires YYYYMMDD)", () => {
  const fields = window.getFieldsForVersion("01");
  const dataObj = { state: "VA", version: "01" };
  fields.forEach(f => { dataObj[f.code] = ""; });
  dataObj.DAA = "DOE,JOHN,M";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "RICHMOND";
  dataObj.DAJ = "VA";
  dataObj.DAK = "23220";
  dataObj.DAQ = "T12345678";
  dataObj.DBA = "20301231"; // YYYYMMDD (correct for V01)
  dataObj.DBB = "01151990"; // INVALID: MMDDYYYY format passed to a YYYYMMDD field
  dataObj.DBC = "M";

  assert.throws(() => {
    window.generateAAMVAPayload("VA", "01", fields, dataObj);
  }, /Invalid field values/, "Generator must reject MMDDYYYY date in a V01 YYYYMMDD date field");
});

/* ============================================================
   VERSION 02 — DCT (GIVEN NAMES) ROUND-TRIP
   Version 02 (AAMVA CDS 2003) uses DCT (Customer Given Names)
   instead of the split DAC/DAD fields introduced in version 03.
   ============================================================ */
test("version 02 uses DCT (not DAC) for given names", () => {
  const fields = window.getFieldsForVersion("02");
  assert.ok(fields.some(f => f.code === "DCT"), "Version 02 should have DCT (Customer Given Names)");
  assert.ok(!fields.some(f => f.code === "DAC"), "Version 02 should NOT have DAC (introduced in v03)");
  assert.ok(!fields.some(f => f.code === "DAD"), "Version 02 should NOT have DAD (introduced in v03)");
});

test("generateAAMVAPayload version 02 round-trip preserves DCT field", () => {
  const fields = window.getFieldsForVersion("02");
  const dataObj = { state: "NY", version: "02" };
  fields.forEach(f => { dataObj[f.code] = ""; });

  // V02 mandatory fields — dates are MMDDYYYY, sex code is 1/2/9
  dataObj.DCT = "JOHN PAUL";   // Given Names (V02 uses DCT, not DAC)
  dataObj.DCS = "SMITH";
  dataObj.DAG = "123 MAIN ST";
  dataObj.DAI = "NEW YORK";
  dataObj.DAJ = "NY";
  dataObj.DAK = "10001";
  dataObj.DAQ = "NY12345678";
  dataObj.DCA = "D";
  dataObj.DCB = "NONE";
  dataObj.DCD = "NONE";
  dataObj.DBA = "12312030"; // MMDDYYYY
  dataObj.DBB = "01011990"; // MMDDYYYY
  dataObj.DBC = "1";        // V02+ uses numeric sex codes
  dataObj.DBD = "01012020"; // MMDDYYYY
  dataObj.DAU = "510";
  dataObj.DAY = "BRO";
  dataObj.DCF = "ABC12345678";
  dataObj.DCG = "USA";
  dataObj.DAW = "180";

  const payload = window.generateAAMVAPayload("NY", "02", fields, dataObj);
  assert.ok(payload.includes("DCTJOHN PAUL"), "V02 payload should include DCT with given names");
  assert.ok(!payload.includes("\nDAC"), "V02 payload should not include DAC field");

  const decoded = window.AAMVA_DECODER.decode(payload);
  assert.ok(decoded.ok, "V02 payload should decode successfully");
  assert.equal(decoded.json.DCT, "JOHN PAUL", "DCT given names should survive round-trip");
  assert.equal(decoded.json.DCS, "SMITH", "Family name should survive round-trip");
  assert.equal(decoded.json.DBB, "01011990", "Date of birth should survive round-trip");
  assert.equal(decoded.json.version, "02", "Version should be 02");
  assert.equal(decoded.json.state, "NY", "State should be resolved from IIN");
});

/* ============================================================
   VALIDATOR — ID CARD SUBFILE SUPPORT
   validateAAMVAPayloadStructure and the decoder must accept
   both DL (driver license) and ID (identification card) as
   valid AAMVA subfile types per the spec.
   ============================================================ */
test("validateAAMVAPayloadStructure accepts ID subfile type for identification cards", () => {
  // Construct a minimal synthetic AAMVA ID-card payload manually.
  // Header (19 bytes) + numEntries (2) + directory (10) + subfile (14) = 45 bytes total.
  const idPayload =
    "@\n\x1e\rANSI " +      // 9 bytes: compliance indicator + separators + file type
    "636001" +               // 6 bytes: NY IIN
    "10" +                   // 2 bytes: AAMVA version 10
    "00" +                   // 2 bytes: jurisdiction version
    "01" +                   // 2 bytes: number of directory entries
    "ID" + "0031" + "0014" + // 10 bytes: directory entry (type=ID, offset=31, length=14)
    "IDDBB01011990\r";       // 14 bytes: subfile content

  const result = window.validateAAMVAPayloadStructure(idPayload);
  assert.deepEqual(result, { ok: true },
    "Validator should accept ID subfile type for AAMVA identification card payloads");
});
