import { describe, it, expect } from "vitest";
import { decodeAAMVAFormat, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";

const buildCaPayload = () => {
  const state = "CA";
  const version = "10";
  const fields = getFieldsForStateAndVersion(state, version);

  return generateAAMVAPayload(state, version, fields, {
    DAQ: "D1234567",
    DCF: "ABCDEFGH1234",
    DCS: "DOE",
    DAC: "JANE",
    DBB: "01011990",
    DBA: "01012030",
    DBD: "01012024",
    DBC: "2",
    DAY: "BRO",
    DAU: "510",
    DAG: "123 MAIN ST",
    DAI: "LOS ANGELES",
    DAJ: "CA",
    DAK: "90001",
    DCG: "USA",
    DCA: "C",
    DCB: "NONE",
    DCD: "NONE",
    DDE: "N",
    DDF: "N",
    DDG: "N"
  });
};

describe("AAMVA decoder", () => {
  it("strips carriage return from the last parsed field value", () => {
    const payload = buildCaPayload();

    const result = decodeAAMVAFormat(payload);

    expect(result.error).toBeUndefined();
    expect(result.data?.DCG).toBe("USA");
  });

  it("rejects non-numeric directory offset and length tokens", () => {
    const payload = buildCaPayload();
    const malformedOffset = `${payload.substring(0, 26)}X${payload.substring(27)}`;
    const malformedLength = `${payload.substring(0, 30)}X${payload.substring(31)}`;

    expect(validateAAMVAPayloadStructure(malformedOffset)).toEqual({
      ok: false,
      error: "Invalid directory offset/length"
    });
    expect(validateAAMVAPayloadStructure(malformedLength)).toEqual({
      ok: false,
      error: "Invalid directory offset/length"
    });
  });

  it("rejects subfiles whose marker does not match the directory entry type", () => {
    const payload = buildCaPayload();
    const mismatchedDirectoryType = `${payload.substring(0, 21)}ID${payload.substring(23)}`;

    expect(validateAAMVAPayloadStructure(mismatchedDirectoryType)).toEqual({
      ok: false,
      error: "Subfile marker does not match directory entry type"
    });
  });
});
