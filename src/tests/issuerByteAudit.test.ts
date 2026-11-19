import { describe, expect, it } from "vitest";
import { decodeAAMVAFormat, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { buildSampleFill } from "../core/sampleFiller";
import { getEffectiveMaxLength, getFieldsForStateAndVersion } from "../core/schema";
import { useFormStore } from "../hooks/useFormStore";
import { buildReadback } from "../hooks/useClerkVoice";
import { buildExportBasename } from "../core/exportNaming";
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

  it.each(["04", "05", "06", "07", "08", "09", "10", "11", "12"])(
    "preserves full DAZ color names and D20 abbreviations in v%s",
    (version) => {
      for (const type of ["DL", "ID"] as const) {
        const fields = getFieldsForStateAndVersion("ID", version, type);
        const sample = buildSampleFill(fields, "ID");
        const generate = (color: string) =>
          generateAAMVAPayload(
            "ID",
            version,
            fields,
            { ...sample, DAZ: color },
            { subfileType: type }
          );
        for (const color of ["BROWN", "AUBURN", "BRO"]) {
          expect(decodeAAMVAFormat(generate(color)).data?.DAZ).toBe(color);
        }
        expect(() => generate("BROWN XY1XY1")).toThrow(/DAZ/);
        expect(() => generate("CHESTNUT")).toThrow(/DAZ/);
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

describe("2005 Table D.3 given names", () => {
  it.each(["DL", "ID"] as const)("uses one required V80ANS field on a v03 %s", (type) => {
    const fields = getFieldsForStateAndVersion("MA", "03", type);
    const name = fields.find((f) => f.code === "DCT")!;
    expect(name.required).toBe(true);
    expect(getEffectiveMaxLength(name)).toBe(80);
    expect(fields.map((f) => f.code)).not.toContain("DAC");
    expect(fields.map((f) => f.code)).not.toContain("DAD");
    const input = { ...buildSampleFill(fields, "MA"), DCT: "A".repeat(80) };
    const generate = (data: Record<string, string>) =>
      generateAAMVAPayload("MA", "03", fields, data, { subfileType: type });
    expect(decodeAAMVAFormat(generate(input)).data?.DCT).toBe(input.DCT);
    expect(() => generate({ ...input, DCT: "A".repeat(81) })).toThrow(/DCT/);
    expect(() => generate({ ...input, DCT: "", DAC: "OLDER" })).toThrow(/DCT/);
  });

  it("preserves legacy first and middle input through both public field table shapes", () => {
    const fields = getFieldsForStateAndVersion("MA", "03");
    const legacy = fields.flatMap((field) =>
      field.code === "DCT"
        ? [
            { ...field, code: "DAC", label: "Customer First Name" },
            { ...field, code: "DAD", label: "Customer Middle Name", required: false }
          ]
        : [field]
    );
    const input = Object.freeze({ ...buildSampleFill(legacy, "MA"), DAC: " SKY ", DAD: " ROSE " });
    for (const schema of [fields, legacy]) {
      const generate = (record: Record<string, string>) =>
        generateAAMVAPayload("MA", "03", schema, record);
      const data = decodeAAMVAFormat(generate(input)).data!;
      expect(data.DCT).toBe("SKY ROSE");
      expect(data).not.toHaveProperty("DAC");
      expect(data).not.toHaveProperty("DAD");
      expect(decodeAAMVAFormat(generate({ ...input, DCT: "BETTY SUE" })).data?.DCT).toBe(
        "BETTY SUE"
      );
      expect(() => generate({ ...input, DAD: "ROSE\n" })).toThrow(/DCT/);
      expect(() => generateAAMVAPayload("MA", "03", schema, input, { sourceFields: true })).toThrow(
        /DCT/
      );
    }
    expect(input).not.toHaveProperty("DCT");
  });

  it("shows the migrated name on import and version changes while preserving the scan", () => {
    const store = useFormStore.getState();
    const previous = useFormStore.getState();
    try {
      const draft = { state: "MA", version: "03", DAC: "SKY", DAD: "ROSE" };
      store.loadJson(draft);
      expect(useFormStore.getState().fields.DCT).toBe("SKY ROSE");
      store.loadJson({ ...draft, version: "04" });
      expect(useFormStore.getState().fields.DCT).toBeUndefined();
      store.setStateVersion("MA", "03");
      expect(useFormStore.getState().fields.DCT).toBe("SKY ROSE");
      store.undo();
      expect(useFormStore.getState().version).toBe("04");
      expect(useFormStore.getState().fields).not.toHaveProperty("DCT");
      store.loadJson({ ...draft, DCT: "" });
      expect(useFormStore.getState().fields.DCT).toBe("");
      store.loadJson(draft, "original scan bytes");
      store.setStateVersion("MA", "03");
      expect(useFormStore.getState().sourcePayload).toBe("original scan bytes");
      expect(useFormStore.getState().fields).not.toHaveProperty("DCT");
    } finally {
      useFormStore.setState(previous, true);
    }
  });

  it("exposes the current combined name through readback and opt-in export", () => {
    const fields = { DCS: "TEST", DCT: "SKY ROSE" };
    expect(buildReadback(fields)).toContain("Given names. SKY ROSE.");
    expect(buildExportBasename({ state: "MA", version: "03", fields, includeName: true })).toBe(
      "MA_TEST_SKYROSE_DL"
    );
    expect(buildExportBasename({ state: "MA", version: "03", fields })).toBe("MA_DL_V03");
  });
});
