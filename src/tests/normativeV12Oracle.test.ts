import { describe, expect, it } from "vitest";
import registry from "../core/conformance/iin-registry-2026-10-31.json";
import oracle from "../core/conformance/normative-v12-oracle.json";
import { AAMVA_STATES } from "../core/states";
import { getFieldsForStateAndVersion } from "../core/schema";
import { generateAAMVAPayload } from "../core/generator";
import { decodeAAMVAFormat } from "../core/decoder";
import { scanPayload } from "./support/scanOracle";

describe("all configured IINs against the captured primary-source registry", () => {
  for (const [state, definition] of Object.entries(AAMVA_STATES)) {
    it(`${state} has the assigned issuer number`, () => {
      const source = registry.rows.find((row) => row.code === state);
      expect(source, `No registry row for ${state}`).toBeDefined();
      expect(definition.IIN).toBe(source?.iin);
    });
  }
});
describe("independent Python v12 byte expectations (synthetic standards tests)", () => {
  it("contains both document types for every configured jurisdiction", () => {
    expect(oracle.tier).toBe("synthetic");
    expect(oracle.vectors.length).toBe(Object.keys(AAMVA_STATES).length * 2);
    expect(new Set(oracle.vectors.map((vector) => vector.state)).size).toBe(55);
  });
  for (const vector of oracle.vectors) {
    it(`${vector.state} ${vector.subfileType} matches independently assembled directory and data bytes`, () => {
      const type = vector.subfileType as "DL" | "ID";
      const fields = getFieldsForStateAndVersion(vector.state, "12", type);
      expect(
        generateAAMVAPayload(vector.state, "12", fields, vector.input, { subfileType: type })
      ).toBe(vector.expectedBytes);
      expect(decodeAAMVAFormat(vector.expectedBytes).data).toMatchObject({
        ...vector.input,
        state: vector.state,
        version: "12",
        subfileType: type
      });
      const scan = scanPayload(vector.expectedBytes);
      expect(scan.ok).toBe(true);
      if (scan.ok) expect(scan.text).toBe(vector.expectedBytes);
    });
  }
});
