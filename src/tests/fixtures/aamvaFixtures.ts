import {
  AAMVA_FIELD_LIMITS,
  AAMVA_FIELD_OPTIONS,
  type AAMVAField,
  getFieldsForStateAndVersion,
  AAMVA_VERSIONS
} from "../../core/schema";
import {
  generateStateDiscriminator,
  generateStateLicenseNumber,
  type GenerateOptions
} from "../../core/generator";
import { AAMVA_STATES, isJurisdictionSupported } from "../../core/states";

export type FixtureCategory = "golden" | "edge" | "negative" | "jurisdiction";

export interface FixtureExpectation {
  valid: boolean;
  roundTripDecode?: boolean;
  payloadContains?: string[];
  payloadDoesNotContain?: string[];
  expectedErrorIncludes?: string[];
}

export interface AamvaFixture {
  id: string;
  title: string;
  category: FixtureCategory;
  syntheticOnly: true;
  jurisdiction: string;
  version: string;
  options?: GenerateOptions;
  data: Record<string, string>;
  expectations: FixtureExpectation;
}

function formatDate(
  dateFormat: "MMDDYYYY" | "YYYYMMDD" | undefined,
  y: number,
  m: number,
  d: number
) {
  const yyyy = String(y);
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return dateFormat === "YYYYMMDD" ? `${yyyy}${mm}${dd}` : `${mm}${dd}${yyyy}`;
}

function withLengthLimit(code: string, value: string) {
  const max = AAMVA_FIELD_LIMITS[code];
  if (!max) return value;
  return value.slice(0, max);
}

function defaultValueForField(field: AAMVAField, state: string): string {
  if (field.options?.length) return field.options[0].value;
  if (AAMVA_FIELD_OPTIONS[field.code]?.length) return AAMVA_FIELD_OPTIONS[field.code][0].value;

  switch (field.code) {
    case "DAQ":
      return generateStateLicenseNumber(state);
    case "DCF":
      return generateStateDiscriminator(state);
    case "DCS":
      return "TESTLAST";
    case "DAC":
      return "TESTFIRST";
    case "DAD":
      return "TESTMIDDLE";
    case "DAG":
      return "123 TEST ONLY ST";
    case "DAI":
      return "TESTVILLE";
    case "DAJ":
      return state;
    case "DAK":
      return "12345";
    case "DCG":
      return "USA";
    case "DBB":
      return formatDate(field.dateFormat, 1990, 1, 15);
    case "DBD":
    case "DDB":
      return formatDate(field.dateFormat, 2020, 1, 1);
    case "DBA":
      return formatDate(field.dateFormat, 2030, 1, 1);
    default:
      if (field.type === "date") return formatDate(field.dateFormat, 2024, 1, 1);
      if (field.type === "zip") return "12345";
      if (field.type === "char") return "1";
      return withLengthLimit(field.code, `TEST${field.code}`);
  }
}

function makeFixture(
  id: string,
  title: string,
  category: FixtureCategory,
  jurisdiction: string,
  version: string,
  mutate?: (data: Record<string, string>, fields: AAMVAField[]) => void,
  expectations: FixtureExpectation = { valid: true, roundTripDecode: true }
): AamvaFixture {
  const fields = getFieldsForStateAndVersion(jurisdiction, version);
  const data: Record<string, string> = {};

  for (const field of fields) {
    if (field.required) {
      data[field.code] = defaultValueForField(field, jurisdiction);
    }
  }

  data.DCS = "TESTLAST";
  data.DAC = "TESTFIRST";
  data.DAG = withLengthLimit("DAG", "123 TEST ONLY ST");

  if (mutate) mutate(data, fields);

  return {
    id,
    title,
    category,
    syntheticOnly: true,
    jurisdiction,
    version,
    data,
    expectations
  };
}

const supportedJurisdictions = Object.keys(AAMVA_STATES).filter((code) =>
  isJurisdictionSupported(code)
);

const versionCoverageFixtures: AamvaFixture[] = Object.keys(AAMVA_VERSIONS).map((version) => {
  const jurisdiction =
    supportedJurisdictions.find((code) => AAMVA_STATES[code].aamvaVersion === version) ?? "CA";

  return makeFixture(
    `golden-v${version}-${jurisdiction.toLowerCase()}`,
    `Golden synthetic fixture for version ${version} (${jurisdiction})`,
    "golden",
    jurisdiction,
    version,
    undefined,
    {
      valid: true,
      roundTripDecode: true,
      payloadContains: ["TEST"],
      payloadDoesNotContain: ["REAL", "SAMPLE PERSON"]
    }
  );
});

export const VERSION_MATRIX_01_TO_10 = Array.from({ length: 10 }, (_, i) => {
  const version = String(i + 1).padStart(2, "0");
  return {
    version,
    supportedByGenerator: Boolean(AAMVA_VERSIONS[version]),
    fixtureCount: versionCoverageFixtures.filter((fixture) => fixture.version === version).length
  };
});

const jurisdictionCoverageFixtures: AamvaFixture[] = supportedJurisdictions.map((jurisdiction) => {
  const version = AAMVA_STATES[jurisdiction].aamvaVersion;
  return makeFixture(
    `jurisdiction-${jurisdiction.toLowerCase()}-v${version}`,
    `Jurisdiction coverage fixture for ${jurisdiction} version ${version}`,
    "jurisdiction",
    jurisdiction,
    version,
    undefined,
    { valid: true, roundTripDecode: true, payloadContains: ["TEST"] }
  );
});

const edgeFixtures: AamvaFixture[] = [
  makeFixture("edge-leap-day-dob", "Leap day date of birth", "edge", "CA", "10", (data, fields) => {
    const dbb = fields.find((f) => f.code === "DBB");
    if (dbb) data.DBB = formatDate(dbb.dateFormat, 2000, 2, 29);
  }),
  makeFixture("edge-zip-plus4", "ZIP+4 formatting", "edge", "TX", "10", (data) => {
    data.DAK = "75001-1234";
  }),
  makeFixture("edge-long-hyphenated-name", "Long hyphenated names", "edge", "NY", "10", (data) => {
    data.DCS = "TEST-VERY-LONG-HYPHENATED-LASTNAME";
    data.DAC = "TEST-ANNE-MARIE";
  }),
  makeFixture(
    "edge-v01-date-format",
    "v01 YYYYMMDD date handling",
    "edge",
    "SC",
    "01",
    (data, fields) => {
      const dbb = fields.find((f) => f.code === "DBB");
      if (dbb) data.DBB = formatDate(dbb.dateFormat, 1999, 12, 31);
    }
  )
];

const negativeFixtures: AamvaFixture[] = [
  makeFixture(
    "negative-expiry-before-issue",
    "Expiry date before issue date should fail",
    "negative",
    "CA",
    "10",
    (data, fields) => {
      const dba = fields.find((f) => f.code === "DBA");
      const dbd = fields.find((f) => f.code === "DBD");
      if (dba) data.DBA = formatDate(dba.dateFormat, 2020, 1, 1);
      if (dbd) data.DBD = formatDate(dbd.dateFormat, 2024, 1, 1);
    },
    { valid: false, expectedErrorIncludes: ["Cross-field validation failed", "DBA"] }
  ),
  makeFixture(
    "negative-bad-zip",
    "Bad ZIP should fail field validation",
    "negative",
    "CA",
    "10",
    (data) => {
      data.DAK = "12";
    },
    { valid: false, expectedErrorIncludes: ["Invalid field values", "DAK"] }
  ),
  {
    ...makeFixture(
      "negative-unsupported-jurisdiction",
      "Unsupported jurisdiction",
      "negative",
      "AS",
      "10"
    ),
    jurisdiction: "ZZ",
    expectations: { valid: false, expectedErrorIncludes: ["Unknown state code"] }
  }
];

export const QA_FIXTURES = {
  golden: versionCoverageFixtures,
  jurisdiction: jurisdictionCoverageFixtures,
  edge: edgeFixtures,
  negative: negativeFixtures
};

export const ALL_QA_FIXTURES: AamvaFixture[] = [
  ...QA_FIXTURES.golden,
  ...QA_FIXTURES.jurisdiction,
  ...QA_FIXTURES.edge,
  ...QA_FIXTURES.negative
];
