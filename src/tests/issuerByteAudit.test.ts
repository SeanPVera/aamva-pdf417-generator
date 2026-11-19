import { describe, expect, it } from "vitest";
import { decodeAAMVAFormat, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { buildSampleFill } from "../core/sampleFiller";
import { getFieldsForStateAndVersion } from "../core/schema";
import southDakota from "../core/conformance/published/2026-10-25.json";
import westVirginia from "../core/conformance/published/2026-11-19.json";

describe("Annex D checks from the matching-issuer source audit", () => {
  it.each([
    ["SD", "04", southDakota.payloads],
    ["WV", "09", westVirginia.payloads]
  ] as const)(
    "reports both placeholder dates in the public %s specimen",
    (state, version, rows) => {
      const source = rows.find((row) => row.jurisdiction === state)!;
      const data = decodeAAMVAFormat(source.rawBytesLatin1).data!;
      expect(data.DDB).toBe("MMDDCCYY");
      expect(data.DDC).toBe("MMDDCCYY");
      expect(() =>
        generateAAMVAPayload(state, version, getFieldsForStateAndVersion(state, version), data)
      ).toThrow(/\(DDB\).*\(DDC\)/);
    }
  );

  it.each(["04", "05", "06", "07", "08", "09", "10"])(
    "preserves a valid DL endorsement expiry in v%s",
    (version) => {
      const fields = getFieldsForStateAndVersion("WV", version);
      const data = { ...buildSampleFill(fields, "WV"), DDC: "02292028" };
      const payload = generateAAMVAPayload("WV", version, fields, data);
      expect(payload).toContain("\nDDC02292028");
      expect(decodeAAMVAFormat(payload).data?.DDC).toBe("02292028");
      const idFields = getFieldsForStateAndVersion("WV", version, "ID");
      expect(idFields.some((f) => f.code === "DDC")).toBe(false);
      expect(
        generateAAMVAPayload("WV", version, fields, data, { subfileType: "ID" })
      ).not.toContain("\nDDC");
    }
  );

  it.each(["11", "12"])("omits reserved DDC from the v%s schema", (version) => {
    expect(getFieldsForStateAndVersion("WV", version).some((f) => f.code === "DDC")).toBe(false);
  });

  it.each(["DL", "ID"] as const)("preserves the v04 limited-duration indicator on a %s", (type) => {
    const fields = getFieldsForStateAndVersion("IN", "04", type);
    const input = { ...buildSampleFill(fields, "IN"), DDD: "1" };
    const payload = generateAAMVAPayload("IN", "04", fields, input, { subfileType: type });
    expect(decodeAAMVAFormat(payload).data?.DDD).toBe("1");
    expect(() =>
      generateAAMVAPayload("IN", "04", fields, { ...input, DDD: "X" }, { subfileType: type })
    ).toThrow(/DDD/);
  });

  it.each(["DL", "ID"] as const)(
    "reads and emits the optional age thresholds on a %s from v05",
    (type) => {
      const values = { DDH: "04152024", DDI: "04152025", DDJ: "04152027" };
      expect(getFieldsForStateAndVersion("DE", "04", type).some(({ code }) => code in values)).toBe(
        false
      );
      for (const version of ["05", "06", "07", "08", "09", "10", "11", "12"]) {
        const fields = getFieldsForStateAndVersion("DE", version, type);
        const input = { ...buildSampleFill(fields, "DE"), ...values };
        const generate = (data: Record<string, string>) =>
          generateAAMVAPayload("DE", version, fields, data, { subfileType: type });
        expect(decodeAAMVAFormat(generate(input)).data).toMatchObject(values);
        expect(() => generate({ ...input, DDJ: "MMDDCCYY" })).toThrow(/DDJ/);
      }
    }
  );

  it("requires a revision date when the card claims full DHS compliance", () => {
    const fields = getFieldsForStateAndVersion("WV", "09");
    const data = { ...buildSampleFill(fields, "WV"), DDA: "F", DDB: "" };
    expect(() => generateAAMVAPayload("WV", "09", fields, data)).toThrow(/DDB/);
    expect(() => generateAAMVAPayload("WV", "09", fields, { ...data, DDA: "N" })).not.toThrow();
  });

  it("accepts historical material compliance through v08 and requires its revision date", () => {
    for (const version of ["04", "05", "06", "07", "08", "09", "10", "11", "12"]) {
      const fields = getFieldsForStateAndVersion("DE", version);
      const data = { ...buildSampleFill(fields, "DE"), DDA: "M" };
      const generate = (input: Record<string, string>) =>
        generateAAMVAPayload("DE", version, fields, input);
      if (Number(version) <= 8) {
        expect(decodeAAMVAFormat(generate(data)).data?.DDA).toBe("M");
        expect(() => generate({ ...data, DDB: "" })).toThrow(/DDB/);
      } else {
        expect(() => generate(data)).toThrow(/DDA/);
      }
    }
  });

  it("requires the segment terminator on jurisdiction subfiles in strict framing", () => {
    const raw = westVirginia.payloads.find((row) => row.jurisdiction === "WV")!.rawBytesLatin1;
    expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(true);
    const unterminated = raw.slice(0, -1) + " ";
    expect(validateAAMVAPayloadStructure(unterminated, true).error).toMatch(/terminator in ZW/);
    expect(validateAAMVAPayloadStructure(unterminated).ok).toBe(true);
  });
});
