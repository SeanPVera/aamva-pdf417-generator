import { publishedObservations } from "./support/publishedIntake";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import intake from "../core/conformance/published/2026-11-19.json";
import continuation from "../core/conformance/published/2026-11-19-continuation.json";
import ledger from "../core/conformance/coverage-ledger-2026-11-19.json";
import { AAMVA_STATES } from "../core/states";
import { decodeAAMVAFormat, readDirectory, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { identifyObservedEncodingProfile } from "../core/observedProfiles";
import { getFieldsForStateAndVersion } from "../core/schema";
import { loadVectors } from "./support/conformanceVectors";

describe("November public specimen intake", () => {
  const sources = new Map(intake.sources.map((source) => [source.id, source]));
  const vectors = loadVectors();

  it("adds distinct source payloads across all intake manifests", () => {
    const hashes = publishedObservations.map((payload) => payload.sha256);
    expect(new Set(hashes).size).toBe(hashes.length);
    for (const repeated of intake.reobservations) {
      expect(intake.payloads.some((source) => source.sha256 === repeated.payloadSha256)).toBe(true);
    }
  });

  it("accounts for every jurisdiction and ties the dated ledger to retained fixtures", () => {
    expect(ledger.jurisdictions.map((row) => row.code).sort()).toEqual(
      Object.keys(AAMVA_STATES).sort()
    );
    const observations = new Map(publishedObservations.map((row) => [row.sha256, row]));
    const covered = ledger.jurisdictions.filter((row) => row.externalReferences.length);
    const recorded = covered.flatMap((row) => row.externalReferences);
    expect(covered).toHaveLength(ledger.counts.withExternalReferences);
    expect(recorded).toHaveLength(ledger.counts.externalReferences);
    expect(new Set(recorded.map((entry) => entry.id)).size).toBe(recorded.length);
    const datedPayloads = ledger.jurisdictions.flatMap((row) => row.publishedObservations);
    expect(new Set(datedPayloads.map((entry) => entry.sha256)).size).toBe(
      ledger.counts.sourcePayloads
    );
    for (const row of ledger.jurisdictions) {
      for (const entry of row.externalReferences) {
        const vector = vectors.find((candidate) => candidate.id === entry.id);
        expect(vector).toMatchObject({
          state: row.code,
          version: entry.version,
          subfileType: entry.type,
          provenance: { fidelity: entry.fidelity }
        });
      }
      for (const entry of row.publishedObservations) {
        expect(observations.get(entry.sha256)).toMatchObject({
          id: entry.id,
          jurisdiction: row.code
        });
      }
    }
  });

  it("checks every New Jersey continuation specimen against its original rejection", () => {
    const cases = continuation.payloads.filter((p) => p.jurisdiction === "NJ");
    expect(cases).toHaveLength(10);
    for (const source of cases) {
      const raw = source.rawBytesLatin1;
      expect(createHash("sha256").update(raw, "latin1").digest("hex")).toBe(source.sha256);
      expect(validateAAMVAPayloadStructure(raw, true)).toEqual(source.applicationResult!.strict);
      const decoded = decodeAAMVAFormat(raw).data!;
      expect(decoded.state).toBe("NJ");
      expect(decoded.DDA).toBe("B");
      expect(() =>
        generateAAMVAPayload("NJ", "04", getFieldsForStateAndVersion("NJ", "04"), decoded)
      ).toThrow(source.applicationResult!.encoder.reason);
    }
  });

  for (const source of intake.payloads) {
    it(`${source.id} preserves source bytes, directory and qualification`, () => {
      const raw = source.rawBytesLatin1;
      const bytes = Buffer.from(raw, "latin1");
      expect(bytes.length).toBe(source.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
      expect(sources.get(source.sourceId)?.sha256).toBe(source.sourceSha256);
      const vector = vectors.find((v) => v.provenance.payloadSha256 === source.sha256);
      const decoded = decodeAAMVAFormat(raw);

      if (source.decoderStatus === "rejected") {
        expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(false);
        expect(decoded.error).toContain("directory declares the entire 485-byte payload");
        expect(vector).toBeUndefined();
        return;
      }

      const directory = readDirectory(raw, true);
      expect(directory.error).toBeUndefined();
      expect(
        directory.entries.map(({ type, declaredOffset, declaredLength }) => ({
          type,
          offset: declaredOffset,
          length: declaredLength
        }))
      ).toEqual(source.independentDirectory);
      expect(decoded.error).toBeUndefined();
      expect(decoded.data).toMatchObject(source.independentExpectedFields);
      expect(decoded.data?.state).toBe(source.jurisdiction);
      if (source.encoderStatus === "source-exact") {
        expect(vector?.expectedBytes).toBe(raw);
        expect(vector?.provenance.evidenceImageSha256).toBe(source.imageSha256);
        return;
      }
      expect(vector).toBeUndefined();
      const { state, version } = decoded.data!;
      expect(() =>
        generateAAMVAPayload(
          state!,
          version!,
          getFieldsForStateAndVersion(state!, version!),
          decoded.data!
        )
      ).toThrow(/Card Revision Date/);
    });
  }

  it("recognizes the two published California name layouts and rejects other omissions", () => {
    const samples = intake.payloads.filter((source) => source.jurisdiction === "CA");
    expect(samples.map((s) => Object.hasOwn(s.independentExpectedFields, "DCU")).sort()).toEqual([
      false,
      true
    ]);
    for (const source of samples) {
      expect(identifyObservedEncodingProfile(source.rawBytesLatin1)).toBe(
        "ca-dmv-verification-v10"
      );
      // Change only an element identifier, preserving every directory length.
      expect(
        identifyObservedEncodingProfile(source.rawBytesLatin1.replace("\nDAZ", "\nZAZ"))
      ).toBeUndefined();
      expect(
        identifyObservedEncodingProfile(source.rawBytesLatin1.replace("\nZCE", "\nZCX"))
      ).toBeUndefined();
      const otherSubfile = source.rawBytesLatin1
        .replace("ZC0", "ZY0")
        .replace("\rZCZCA", "\rZYZCA");
      expect(identifyObservedEncodingProfile(otherSubfile)).toBeUndefined();
    }
  });
});
