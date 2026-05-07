import { describe, test, expect } from "vitest";
import {
  AAMVA_FIELD_GROUPS,
  AAMVA_VERSIONS,
  getFieldGroup,
  type FieldGroupId
} from "../core/schema";

describe("AAMVA_FIELD_GROUPS", () => {
  test("defines five groups in display order", () => {
    expect(AAMVA_FIELD_GROUPS.map((g) => g.id)).toEqual([
      "identity",
      "address",
      "physical",
      "license",
      "privileges"
    ]);
  });

  test("each group has a non-empty label and description", () => {
    for (const group of AAMVA_FIELD_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.description.length).toBeGreaterThan(0);
    }
  });

  test("group ids are unique", () => {
    const ids = AAMVA_FIELD_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getFieldGroup", () => {
  test("classifies known identity fields", () => {
    for (const code of ["DAA", "DCS", "DAC", "DAD", "DBB", "DBC"]) {
      expect(getFieldGroup(code)).toBe("identity");
    }
  });

  test("classifies known address fields", () => {
    for (const code of ["DAG", "DAH", "DAI", "DAJ", "DAK"]) {
      expect(getFieldGroup(code)).toBe("address");
    }
  });

  test("classifies known physical description fields", () => {
    for (const code of ["DAU", "DAW", "DAY", "DAZ", "DCL"]) {
      expect(getFieldGroup(code)).toBe("physical");
    }
  });

  test("classifies license-detail fields", () => {
    for (const code of ["DAQ", "DCF", "DCG", "DBA", "DBD", "DDA", "DDK", "DDL"]) {
      expect(getFieldGroup(code)).toBe("license");
    }
  });

  test("classifies privileges fields", () => {
    for (const code of ["DAR", "DCA", "DAS", "DCB", "DAT", "DCD"]) {
      expect(getFieldGroup(code)).toBe("privileges");
    }
  });

  test("falls back to a known group for unknown codes", () => {
    const known: FieldGroupId[] = AAMVA_FIELD_GROUPS.map((g) => g.id);
    expect(known).toContain(getFieldGroup("ZZZ"));
  });

  test("every field across every version is classified", () => {
    const knownGroups = new Set<FieldGroupId>(AAMVA_FIELD_GROUPS.map((g) => g.id));
    for (const versionDef of Object.values(AAMVA_VERSIONS)) {
      for (const field of versionDef.fields) {
        const group = getFieldGroup(field.code);
        expect(knownGroups.has(group)).toBe(true);
      }
    }
  });
});

describe("filtering and grouping logic", () => {
  // Mirror the App's filter logic so we can verify it deterministically.
  const filterFields = (
    fields: ReadonlyArray<{ code: string; label: string; required?: boolean }>,
    query: string,
    requiredOnly: boolean
  ) => {
    const q = query.trim().toLowerCase();
    return fields.filter((f) => {
      if (requiredOnly && !f.required) return false;
      if (!q) return true;
      return f.code.toLowerCase().includes(q) || f.label.toLowerCase().includes(q);
    });
  };

  const sampleFields = [
    { code: "DCS", label: "Customer Family Name", required: true },
    { code: "DAC", label: "Customer First Name", required: true },
    { code: "DAH", label: "Address Line 2" },
    { code: "DAW", label: "Weight (pounds)" },
    { code: "DBA", label: "Expiration Date", required: true }
  ];

  test("required-only filter drops optional fields", () => {
    const result = filterFields(sampleFields, "", true);
    expect(result.map((f) => f.code)).toEqual(["DCS", "DAC", "DBA"]);
  });

  test("query matches field code case-insensitively", () => {
    const result = filterFields(sampleFields, "daw", false);
    expect(result.map((f) => f.code)).toEqual(["DAW"]);
  });

  test("query matches field label substring", () => {
    const result = filterFields(sampleFields, "address", false);
    expect(result.map((f) => f.code)).toEqual(["DAH"]);
  });

  test("query and required-only combine", () => {
    const result = filterFields(sampleFields, "name", true);
    expect(result.map((f) => f.code)).toEqual(["DCS", "DAC"]);
  });

  test("empty query returns all fields when required-only is off", () => {
    const result = filterFields(sampleFields, "   ", false);
    expect(result.length).toBe(sampleFields.length);
  });
});
