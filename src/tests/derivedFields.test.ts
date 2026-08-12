import { describe, it, expect } from "vitest";
import {
  DERIVED_FIELD_CODES,
  hasUserData,
  isDerivedField,
  userEnteredCodes
} from "../core/derivedFields";

// DAJ is filled from the jurisdiction picker the moment the app loads, so any
// dirty-state check that counts raw field values reads an untouched form as
// populated — which installed the unsaved-work prompt on a blank page, hid the
// mobile bar's empty state, and made "Clear PII" claim it had cleared a field.
describe("derived fields", () => {
  it("treats the jurisdiction code as app-owned", () => {
    expect(isDerivedField("DAJ")).toBe(true);
    expect(DERIVED_FIELD_CODES.has("DAJ")).toBe(true);
  });

  it("treats everything the user types as their own", () => {
    for (const code of ["DCS", "DAC", "DBB", "DAQ"]) {
      expect(isDerivedField(code)).toBe(false);
    }
  });

  describe("hasUserData", () => {
    it("is false for an empty form", () => {
      expect(hasUserData({})).toBe(false);
    });

    it("is false for a form holding only derived values", () => {
      expect(hasUserData({ DAJ: "CA" })).toBe(false);
    });

    it("is false when every user field is blank or whitespace", () => {
      expect(hasUserData({ DAJ: "CA", DCS: "", DAC: "   " })).toBe(false);
    });

    it("is true as soon as the user enters something", () => {
      expect(hasUserData({ DAJ: "CA", DCS: "DOE" })).toBe(true);
    });
  });

  describe("userEnteredCodes", () => {
    it("lists only non-empty, non-derived codes", () => {
      expect(userEnteredCodes({ DAJ: "CA", DCS: "DOE", DAC: "", DBB: "01011990" })).toEqual([
        "DCS",
        "DBB"
      ]);
    });

    it("is empty for a form the user has not touched", () => {
      expect(userEnteredCodes({ DAJ: "CA" })).toEqual([]);
    });
  });
});
