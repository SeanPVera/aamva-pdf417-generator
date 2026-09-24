import { describe, it, expect } from "vitest";
import {
  DERIVED_FIELD_CODES,
  hasUserData,
  isDerivedField,
  userEnteredCodes
} from "../core/derivedFields";

// Address jurisdiction is entered data, even when it happens to match the issuer.
describe("record-owned fields", () => {
  it("never treats address jurisdiction as app-owned", () => {
    expect(isDerivedField("DAJ")).toBe(false);
    expect(DERIVED_FIELD_CODES.has("DAJ")).toBe(false);
  });
  it("counts every non-empty identity field", () => {
    for (const code of ["DCS", "DAC", "DBB", "DAQ", "DAJ"])
      expect(isDerivedField(code)).toBe(false);
    expect(userEnteredCodes({ DAJ: "NV", DCS: "EXAMPLE", DAC: "", DBB: "01011990" })).toEqual([
      "DAJ",
      "DCS",
      "DBB"
    ]);
  });
  it("distinguishes blank records from address-only records", () => {
    expect(hasUserData({})).toBe(false);
    expect(hasUserData({ DAJ: "", DCS: "  " })).toBe(false);
    expect(hasUserData({ DAJ: "NV" })).toBe(true);
    expect(userEnteredCodes({ DAJ: "NV" })).toEqual(["DAJ"]);
  });
});

describe("app-seeded values are not user data", () => {
  // The app pre-fills a few structural elements on load. Counted as typing,
  // they made a form nobody had touched report filled fields — so the
  // unsaved-work prompt fired on every refresh of a blank page and Clear PII
  // claimed to have cleared values that were never entered.
  const seeds = { DDE: "N", DDF: "N", DDG: "N", DCG: "USA" };

  test("an untouched seeded form holds no user data", () => {
    expect(hasUserData({ ...seeds }, seeds)).toBe(false);
    expect(userEnteredCodes({ ...seeds }, seeds)).toEqual([]);
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
