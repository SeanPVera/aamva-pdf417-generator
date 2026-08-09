import { describe, it, expect } from "vitest";
import { validateFieldValue, sanitizeFieldValue } from "../core/validation";
import type { AAMVAField } from "../core/schema";

const zipField: AAMVAField = { code: "DAK", type: "zip", label: "Zip" };

describe("Validation Helpers", () => {
  it("sanitizes field values by removing control characters", () => {
    // Basic test cases
    expect(sanitizeFieldValue("test\x00value")).toBe("testvalue");
    expect(sanitizeFieldValue("normal")).toBe("normal");

    // Empty string
    expect(sanitizeFieldValue("")).toBe("");

    // Completely control characters
    expect(sanitizeFieldValue("\x00\x01\x1f\x7f")).toBe("");

    // Common control characters (backspace, tab, newline, CR)
    expect(sanitizeFieldValue("a\x08b\x09c\x0ad\x0d")).toBe("abcd");

    // DEL character
    expect(sanitizeFieldValue("delete\x7f")).toBe("delete");

    // Control characters at start and end
    expect(sanitizeFieldValue("\x01start and end\x1f")).toBe("start and end");
  });

  it("validates basic zip codes", () => {
    expect(validateFieldValue(zipField, "12345")).toBe(true);
    expect(validateFieldValue(zipField, "12345-6789")).toBe(true);
    expect(validateFieldValue(zipField, "1234")).toBe(false);
  });
});
