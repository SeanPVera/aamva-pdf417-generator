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

describe("app-seeded values are not user data", () => {
  // The app pre-fills a few structural elements on load. Counted as typing,
  // they made a form nobody had touched report filled fields — so the
  // unsaved-work prompt fired on every refresh of a blank page and Clear PII
  // claimed to have cleared values that were never entered.
  const seeds = { DDE: "N", DDF: "N", DDG: "N", DCG: "USA" };

  test("an untouched seeded form holds no user data", () => {
    expect(hasUserData({ ...seeds, DAJ: "CA" }, seeds)).toBe(false);
    expect(userEnteredCodes({ ...seeds, DAJ: "CA" }, seeds)).toEqual([]);
  });

  test("a seeded code counts once the user changes it", () => {
    expect(hasUserData({ ...seeds, DCG: "CAN" }, seeds)).toBe(true);
    expect(userEnteredCodes({ ...seeds, DCG: "CAN" }, seeds)).toEqual(["DCG"]);
  });

  test("anything the user types alongside the seeds still counts", () => {
    expect(hasUserData({ ...seeds, DCS: "DOE" }, seeds)).toBe(true);
    expect(userEnteredCodes({ ...seeds, DCS: "DOE" }, seeds)).toEqual(["DCS"]);
  });

  test("without the seed map every filled code counts, as before", () => {
    expect(hasUserData({ ...seeds })).toBe(true);
  });
});
