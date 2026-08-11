import { describe, it, expect } from "vitest";
import { getCanonicalRewrite, getQuickFix, getQuickFixes } from "../core/quickFix";
import { evaluateFieldValue } from "../core/validation";
import { getFieldsForStateAndVersion, type AAMVAField } from "../core/schema";

const field = (code: string, overrides: Partial<AAMVAField> = {}): AAMVAField => ({
  code,
  label: code,
  type: "string",
  ...overrides
});

const DBB = field("DBB", { type: "date", dateFormat: "MMDDYYYY" });
const DAY = field("DAY");
const DBC = field("DBC");
const DAK = field("DAK", { type: "zip" });
const DDE = field("DDE", { type: "char" });
const DAQ = field("DAQ");

describe("getQuickFix", () => {
  // The whole point: a fix must leave the field passing, never half-repaired.
  it("only ever returns a value that passes validation", () => {
    const cases: Array<[AAMVAField, string, string | undefined]> = [
      [DBB, "8/11/1990", undefined],
      [DAY, "brown", undefined],
      [DBC, "F", undefined],
      [DAK, " 90001 ", undefined],
      [DDE, "no", undefined],
      [DAQ, "a1234567", "CA"]
    ];
    for (const [f, value, state] of cases) {
      const fix = getQuickFix(f, value, state, true);
      expect(fix, `${f.code} "${value}"`).not.toBeNull();
      expect(evaluateFieldValue(f, fix!.value, state, true).ok).toBe(true);
    }
  });

  it("reformats dates typed the way humans type them", () => {
    expect(getQuickFix(DBB, "8/11/1990")?.value).toBe("08111990");
    expect(getQuickFix(DBB, "1990-08-11")?.value).toBe("08111990");
    expect(
      getQuickFix(field("DBB", { type: "date", dateFormat: "YYYYMMDD" }), "8/11/1990")?.value
    ).toBe("19900811");
  });

  it("maps spelled-out values onto their AAMVA codes", () => {
    expect(getQuickFix(DAY, "brown")?.value).toBe("BRO");
    expect(getQuickFix(DAY, "Grey")?.value).toBe("GRY");
    expect(getQuickFix(field("DAZ"), "blonde")?.value).toBe("BLN");
    expect(getQuickFix(DBC, "F")?.value).toBe("2");
    expect(getQuickFix(field("DCG"), "United States")?.value).toBe("USA");
    expect(getQuickFix(field("DDK"), "yes")?.value).toBe("1");
  });

  it("keeps only the digits of a postal code with stray spaces", () => {
    expect(getQuickFix(DAK, " 90001 ")?.value).toBe("90001");
  });

  it("uppercases a state-patterned licence number", () => {
    expect(getQuickFix(DAQ, "a1234567", "CA", true)?.value).toBe("A1234567");
  });

  it("truncates past the field's character limit", () => {
    const long = "A".repeat(30);
    // DAI is capped at 20 characters.
    expect(getQuickFix(field("DAI"), long)?.value).toBe("A".repeat(20));
  });

  it("returns null when there is nothing to repair", () => {
    expect(getQuickFix(DBB, "08111990")).toBeNull();
    expect(getQuickFix(DAY, "BRO")).toBeNull();
  });

  // Repairing an empty field would mean inventing a value, which is the one
  // thing this module must never do.
  it("never invents a value for an empty field", () => {
    expect(getQuickFix(field("DCS", { required: true }), "")).toBeNull();
    expect(getQuickFix(field("DCS", { required: true }), "   ")).toBeNull();
  });

  it("returns null when no candidate can be made to pass", () => {
    expect(getQuickFix(DAY, "chartreuse")).toBeNull();
    expect(getQuickFix(DBB, "not a date")).toBeNull();
  });
});

// Some values pass every validator and still are not what ends up in the
// barcode: the generator uppercases, strips accents, and drops the ZIP dash.
// Showing the user one string while encoding another is the gap this closes.
describe("getCanonicalRewrite", () => {
  it("normalizes heights written the way people say them", () => {
    const DAU = field("DAU");
    expect(getCanonicalRewrite(DAU, "5'9\"")?.value).toBe("069 IN");
    expect(getCanonicalRewrite(DAU, "5-9")?.value).toBe("069 IN");
    expect(getCanonicalRewrite(DAU, "69")?.value).toBe("069 IN");
    expect(getCanonicalRewrite(DAU, "175cm")?.value).toBe("175 CM");
    expect(getCanonicalRewrite(DAU, "069 IN")).toBeNull();
    // Spelled out, this one busts the 6-character limit, so it is an outright
    // repair rather than a tidy-up.
    expect(getQuickFix(DAU, "5 ft 9 in")?.value).toBe("069 IN");
  });

  it("drops the dash from a ZIP+4", () => {
    expect(getCanonicalRewrite(DAK, "90001-1234")?.value).toBe("900011234");
    expect(getCanonicalRewrite(DAK, "90001")).toBeNull();
  });

  it("uppercases a name the encoder would rewrite anyway", () => {
    expect(getCanonicalRewrite(field("DCS"), "Doe")?.value).toBe("DOE");
    expect(getCanonicalRewrite(field("DCS"), "  Doe  Smith ")?.value).toBe("DOE SMITH");
    expect(getCanonicalRewrite(field("DCS"), "DOE")).toBeNull();
  });

  it("stays out of the way when the value is outright invalid", () => {
    // That is getQuickFix's job; a cosmetic tidy-up here would mask the error.
    expect(getCanonicalRewrite(DAY, "brown")).toBeNull();
    expect(getCanonicalRewrite(field("DCS", { required: true }), "")).toBeNull();
  });
});

describe("getQuickFixes", () => {
  it("collects one fix per repairable field across a schema", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const fixes = getQuickFixes(
      fields,
      { DBB: "8/11/1990", DAY: "brown", DCS: "DOE", DAQ: "a1234567" },
      "CA",
      true
    );
    const byCode = Object.fromEntries(fixes.map((f) => [f.code, f.value]));
    expect(byCode.DBB).toBe("08111990");
    expect(byCode.DAY).toBe("BRO");
    expect(byCode.DAQ).toBe("A1234567");
    // Already canonical — nothing to do.
    expect(byCode.DCS).toBeUndefined();
  });

  it("includes canonical tidy-ups alongside outright repairs", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const fixes = getQuickFixes(fields, { DAY: "brown", DAU: "5-9" }, "CA", true);
    const byCode = Object.fromEntries(fixes.map((f) => [f.code, f.value]));
    expect(byCode.DAY).toBe("BRO");
    expect(byCode.DAU).toBe("069 IN");
  });

  it("returns an empty list for a clean form", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    expect(getQuickFixes(fields, { DBB: "08111990", DAY: "BRO" }, "CA", true)).toEqual([]);
  });
});
