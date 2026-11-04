import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import intake from "../core/conformance/published/2026-10-31-continuation.json";
import { decodeAAMVAFormat, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";
import { loadVectors } from "./support/conformanceVectors";
import { evaluateFieldValue, validateFieldValue } from "../core/validation";

describe("continued independent specimen acquisition", () => {
  for (const source of intake.payloads) {
    it(`${source.id} retains its independent bytes and source-file identity`, () => {
      const bytes = Buffer.from(source.rawBytesLatin1, "latin1");
      expect(bytes.length).toBe(source.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
      const document = intake.sources.find((candidate) => candidate.id === source.sourceId);
      expect(document?.sha256).toBe(source.sourceSha256);
      expect(source.capturedAt).toBe("2026-10-31");
      if (source.currentDecoderStatus === "accepted") {
        const result = decodeAAMVAFormat(source.rawBytesLatin1);
        expect(result.error).toBeUndefined();
        expect(result.data).toMatchObject(source.independentExpectedFields);
        expect(result.data?.state).toBe(source.jurisdiction);
      }
    });
  }

  it("keeps Montana's observed discriminator width confined to that named specimen", () => {
    const source = intake.payloads.find((candidate) => candidate.sha256.startsWith("fdecdc"))!;
    const data = decodeAAMVAFormat(source.rawBytesLatin1).data!;
    expect(data.DCF).toHaveLength(30);
    expect(() =>
      generateAAMVAPayload("MT", "08", getFieldsForStateAndVersion("MT", "08"), data)
    ).toThrow(/Document Discriminator/);
    const profileId = "mt-2015-public-specimen-v08";
    const fields = getFieldsForStateAndVersion("MT", "08", "DL", profileId);
    expect(generateAAMVAPayload("MT", "08", fields, data, { encodingProfileId: profileId })).toBe(
      source.rawBytesLatin1
    );
    expect(() =>
      generateAAMVAPayload(
        "MT",
        "08",
        fields,
        { ...data, DCF: "1".repeat(31) },
        {
          encodingProfileId: profileId
        }
      )
    ).toThrow(/Document Discriminator/);
    expect(() => getFieldsForStateAndVersion("MT", "12", "DL", profileId)).toThrow(
      /does not match/
    );
  });

  it("retains invalid template dates without promoting them to positive references", () => {
    for (const source of intake.payloads.filter((candidate) =>
      ["0691eccde2d2", "e875813da685"].some((prefix) => candidate.sha256.startsWith(prefix))
    )) {
      const data = decodeAAMVAFormat(source.rawBytesLatin1).data!;
      expect(data.DDB).toBe("MMDDCCYY");
      expect(() =>
        generateAAMVAPayload(
          source.jurisdiction,
          data.version!,
          getFieldsForStateAndVersion(source.jurisdiction, data.version!),
          data
        )
      ).toThrow(/Card Revision Date/);
      expect(
        loadVectors().some((vector) => vector.provenance.payloadSha256 === source.sha256)
      ).toBe(false);
    }
  });

  it("keeps the malformed historical Illinois observation outside positive fixtures", () => {
    const source = intake.payloads.find((candidate) => candidate.jurisdiction === "IL")!;
    expect(source.rawBytesLatin1[2]).toBe("\x1c");
    expect(source.rawBytesLatin1.endsWith("\r")).toBe(false);
    expect(validateAAMVAPayloadStructure(source.rawBytesLatin1, true).ok).toBe(false);
    expect(loadVectors().some((vector) => vector.provenance.payloadSha256 === source.sha256)).toBe(
      false
    );
  });

  it("accepts Florida's historical separated identifier only through its observed format", () => {
    const source = intake.payloads.find((candidate) => candidate.sha256.startsWith("20b099"))!;
    const data = decodeAAMVAFormat(source.rawBytesLatin1).data!;
    const shared = getFieldsForStateAndVersion("FL", "01").find((field) => field.code === "DAQ")!;
    const observed = getFieldsForStateAndVersion(
      "FL",
      "01",
      "DL",
      "fl-public-training-legacy-v01"
    ).find((field) => field.code === "DAQ")!;
    expect(validateFieldValue(shared, data.DAQ!, "FL")).toBe(false);
    expect(evaluateFieldValue(shared, data.DAQ!, "FL").ok).toBe(false);
    expect(validateFieldValue(observed, data.DAQ!, "FL")).toBe(true);
    expect(evaluateFieldValue(observed, data.DAQ!, "FL").ok).toBe(true);
    const malformed = data.DAQ!.replace("-", "/");
    expect(validateFieldValue(observed, malformed, "FL")).toBe(false);
    expect(evaluateFieldValue(observed, malformed, "FL").ok).toBe(false);
    expect(shared).not.toHaveProperty("jurisdictionPattern");
  });

  it("makes the Colorado publishing qualification and excluded private evidence explicit", () => {
    const colorado = intake.sources.find((source) => source.jurisdiction === "CO")!;
    expect(colorado.publisherClass).toBe("public-education-specimen-rehost");
    expect(colorado.corroboratingPublication).toMatch(/^https:\/\/content\.leg\.colorado\.gov\//);
    for (const excluded of intake.excludedObservations) {
      expect(excluded).not.toHaveProperty("rawBytesLatin1");
      expect(
        loadVectors().some((vector) => vector.provenance.payloadSha256 === excluded.payloadSha256)
      ).toBe(false);
    }
  });
});
