import { describe, expect, test } from "vitest";
import { validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";

const baseCaliforniaData = {
  DCS: "DOE",
  DAC: "JANE",
  DBB: "01011990",
  DBA: "01012029",
  DBD: "01012024",
  DAQ: "A1234567",
  DAG: "123 MAIN ST",
  DAI: "LOS ANGELES",
  DAJ: "CA",
  DAK: "90001",
  DBC: "2",
  DAU: "509",
  DAY: "BRO",
  DAZ: "BLK",
  DCG: "USA",
  DCF: "AB12/3456/7890",
  DCA: "D",
  DCB: "NONE",
  DCD: "NONE",
  DDE: "N",
  DDF: "N",
  DDG: "N"
};

describe("strict compliance profile", () => {
  test("strict mode rejects AAMVA versions that do not match jurisdiction profile", () => {
    const fields = getFieldsForStateAndVersion("CA", "09");
    expect(() =>
      generateAAMVAPayload("CA", "09", fields, { ...baseCaliforniaData }, { strictMode: true })
    ).toThrow(/does not match CA compliance profile/);
  });

  test("non-strict mode allows non-default jurisdiction versions", () => {
    const fields = getFieldsForStateAndVersion("CA", "09");
    expect(() =>
      generateAAMVAPayload("CA", "09", fields, { ...baseCaliforniaData }, { strictMode: false })
    ).not.toThrow();
  });

  test("strict mode produces payloads that pass strict structural validation", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const payload = generateAAMVAPayload(
      "CA",
      "10",
      fields,
      { ...baseCaliforniaData },
      { strictMode: true }
    );
    expect(validateAAMVAPayloadStructure(payload, true)).toEqual({ ok: true });
  });
});
