import { describe, it, expect } from "vitest";
import { getValidationIssues } from "../core/validation";
import { AAMVAField } from "../core/schema";

describe("getValidationIssues", () => {
  const fields: AAMVAField[] = [
    { code: "DCS", label: "Family Name", type: "string", required: true },
    { code: "DAC", label: "First Name", type: "string", required: true },
    { code: "DAD", label: "Middle Name", type: "string", required: false },
    { code: "DBB", label: "Date of Birth", type: "date", required: true },
    { code: "DAK", label: "Zip Code", type: "zip", required: true },
    { code: "DAQ", label: "License Number", type: "string", required: true }
  ];

  it("returns no issues when all required fields are valid", () => {
    const values = {
      DCS: "SMITH",
      DAC: "JOHN",
      DBB: "01011990",
      DAK: "12345",
      DAQ: "A1234567"
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(0);
  });

  it("identifies missing required fields", () => {
    const values = {
      DCS: "SMITH",
      // DAC missing
      DBB: "01011990",
      DAK: "12345",
      DAQ: "A1234567"
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "DAC",
      message: "Required field is empty."
    });
  });

  it("identifies multiple missing required fields", () => {
    const values = {
      DCS: "SMITH"
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    // Missing: DAC, DBB, DAK, DAQ
    expect(issues).toHaveLength(4);
  });

  it("identifies invalid date format", () => {
    const values = {
      DCS: "SMITH",
      DAC: "JOHN",
      DBB: "1990-01-01", // Invalid format
      DAK: "12345",
      DAQ: "A1234567"
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("DBB");
    expect(issues[0].message).toBe("Exceeds maximum length of 8 characters.");
  });

  it("identifies invalid zip code", () => {
    const values = {
      DCS: "SMITH",
      DAC: "JOHN",
      DBB: "01011990",
      DAK: "ABCDE", // Invalid zip
      DAQ: "A1234567"
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("DAK");
  });

  it("respects state-specific validation rules (CA license number)", () => {
    const values = {
      DCS: "SMITH",
      DAC: "JOHN",
      DBB: "01011990",
      DAK: "12345",
      DAQ: "12345678" // Invalid for CA (should start with letter)
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("DAQ");
  });

  it("allows missing optional fields", () => {
    const values = {
      DCS: "SMITH",
      DAC: "JOHN",
      DBB: "01011990",
      DAK: "12345",
      DAQ: "A1234567"
      // DAD is missing but it is optional
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(0);
  });

  it("validates optional fields if they are provided", () => {
    const optionalFields: AAMVAField[] = [
      ...fields,
      { code: "DAW", label: "Weight", type: "string", options: [{ value: "150", label: "150" }] }
    ];
    const values = {
      DCS: "SMITH",
      DAC: "JOHN",
      DBB: "01011990",
      DAK: "12345",
      DAQ: "A1234567",
      DAW: "200" // Not in options
    };
    const issues = getValidationIssues(optionalFields, values, "CA", false);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("DAW");
  });

  it("identifies multiple issues of different types", () => {
    const values = {
      DCS: "SMITH",
      // DAC missing (required)
      DBB: "invalid-date", // invalid date
      DAK: "123", // invalid zip
      DAQ: "A1234567"
    };
    const issues = getValidationIssues(fields, values, "CA", false);
    expect(issues).toHaveLength(3);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("DAC");
    expect(codes).toContain("DBB");
    expect(codes).toContain("DAK");
  });
});
