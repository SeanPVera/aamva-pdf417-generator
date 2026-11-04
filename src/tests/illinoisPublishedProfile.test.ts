import { describe, expect, it } from "vitest";

import { getJurisdictionEncoding, getJurisdictionSubfileElements } from "../core/jurisdictionRules";
import { getFieldsForStateAndVersion } from "../core/schema";
import { generateAAMVAPayload } from "../core/generator";
import reference from "../core/conformance/vectors/il-v08-dl-published.json";

describe("published Illinois version 08 layout", () => {
  it("uses the observed profile only for the observed AAMVA edition", () => {
    expect(getJurisdictionEncoding("IL", "08")?.jurisdictionSubfile?.type).toBe("ZI");
    expect(getJurisdictionSubfileElements("IL", "08").map((field) => field.code)).toEqual([
      "ZIA",
      "ZIB"
    ]);
    for (const version of ["07", "09", "10", "11"]) {
      expect(getJurisdictionEncoding("IL", version)).toBeUndefined();
      expect(getFieldsForStateAndVersion("IL", version).some((field) => field.subfile)).toBe(false);
    }
  });

  it("encodes changed input through the profile instead of replaying the reference", () => {
    const fields = getFieldsForStateAndVersion("IL", "08");
    const payload = generateAAMVAPayload("IL", "08", fields, {
      ...reference.input,
      DAC: "ALICE",
      ZIB: "Mixed case"
    });
    expect(payload).toContain("DACALICE\n");
    expect(payload).toContain("ZIBMixed case\n\r");
    expect(payload).not.toBe(reference.expectedBytes);
    // One fewer byte in each edited value shifts the next subfile by one and
    // reduces its own length by one. The directory is computed from the data.
    expect(payload).toContain("DL00410287ZI03280024");
  });
});

describe("published Arkansas and Georgia version 09 layouts", () => {
  for (const state of ["AR", "GA"]) {
    it(`${state} scopes its public sample profile to version 09`, () => {
      expect(getJurisdictionEncoding(state, "09")?.preserveValueCase).toContain("DAU");
      expect(getJurisdictionSubfileElements(state, "09").length).toBeGreaterThan(0);
      expect(getJurisdictionEncoding(state, "08")).toBeUndefined();
      expect(getJurisdictionEncoding(state, "10")).toBeUndefined();
      expect(getJurisdictionSubfileElements(state, "10")).toEqual([]);
    });
  }
});
