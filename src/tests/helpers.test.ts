import { describe, it, expect } from "vitest";
import { validateFieldValue, sanitizeFieldValue } from "../core/validation";
import type { AAMVAField } from "../core/schema";

const zipField: AAMVAField = { code: "DAK", type: "zip", label: "Zip" };

describe("Validation Helpers", () => {
  it("sanitizes field values by removing control characters", () => {
    expect(sanitizeFieldValue("test\x00value")).toBe("testvalue");
    expect(sanitizeFieldValue("normal")).toBe("normal");
  });

  it("validates basic zip codes", () => {
    expect(validateFieldValue(zipField, "12345")).toBe(true);
    expect(validateFieldValue(zipField, "12345-6789")).toBe(true);
    expect(validateFieldValue(zipField, "1234")).toBe(false);
  });
});
