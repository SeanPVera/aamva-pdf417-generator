import { anonymizedObservations, publishedObservations } from "./support/publishedIntake";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { decodeAAMVAFormat } from "../core/decoder";
import { identifyObservedEncodingProfile } from "../core/observedProfiles";
import intakeData from "../core/conformance/published/2026-10-25.json";
import { loadVectors } from "./support/conformanceVectors";

interface PublishedSpecimen {
  id: string;
  jurisdiction: string;
  dataClass: string;
  sourceId: string;
  sourcePage: number;
  sourceUrl: string;
  sourceSha256: string;
  capturedAt: string;
  byteLength: number;
  sha256: string;
  rawBytesLatin1: string;
  imageSha256: string;
  independentExpectedFields: Record<string, string>;
  independentSubfiles: string[];
  currentDecoderStatus: "accepted" | "unsupported-or-malformed";
}

const intake = intakeData as {
  sources: Array<{ id: string; sha256?: string; status: string }>;
  payloads: PublishedSpecimen[];
};

describe("independently scanned published specimens", () => {
  const specimens = intake.payloads;

  it("keeps the acquired set distinct and traceable to downloaded source documents", () => {
    expect(specimens).toHaveLength(26);
    expect(new Set(specimens.map((s) => s.sha256)).size).toBe(specimens.length);
    expect(new Set(specimens.map((s) => s.jurisdiction)).size).toBe(12);
    const sourceById = new Map(intake.sources.map((source) => [source.id, source]));
    for (const specimen of specimens) {
      expect(specimen.dataClass).toBe("jurisdiction-published-sample");
      expect(specimen.sourceUrl).toMatch(/^https:\/\//);
      expect(specimen.sourcePage).toBeGreaterThan(0);
      expect(specimen.capturedAt).toBe("2026-10-25");
      expect(specimen.imageSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(sourceById.get(specimen.sourceId)?.status).toBe("downloaded");
      expect(sourceById.get(specimen.sourceId)?.sha256).toBe(specimen.sourceSha256);
    }
  });

  it("promotes source bytes into positive vectors without changing their evidence", () => {
    const byHash = new Map(publishedObservations.map((specimen) => [specimen.sha256, specimen]));
    for (const vector of loadVectors().filter((entry) => entry.provenance.tier === "published")) {
      if (vector.provenance.fidelity === "anonymized") {
        const receipt = anonymizedObservations.find(
          (entry) => entry.originalPayloadSha256 === vector.provenance.payloadSha256
        );
        expect(receipt, vector.id).toBeDefined();
        const bytes = Buffer.from(vector.expectedBytes, "latin1");
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(
          receipt!.anonymizedPayloadSha256
        );
        expect(receipt!.originalPayloadSha256).not.toBe(receipt!.anonymizedPayloadSha256);
        expect(bytes.length).toBe(receipt!.bytes);
        expect(vector.provenance.sourceSha256).toBe(receipt!.fileSha256);
        expect(vector.provenance.evidenceImageSha256).toBe(receipt!.nativeImageSha256);
        expect(vector.provenance.source).toBe(receipt!.sourceUrl);
        expect(identifyObservedEncodingProfile(vector.expectedBytes)).toBe(
          vector.encodingProfileId
        );
        let end = 0;
        for (const span of receipt!.replacements) {
          expect(span.start).toBeGreaterThanOrEqual(end + 3);
          expect(vector.expectedBytes.slice(span.start - 3, span.start)).toBe(span.field);
          expect(span.endExclusive - span.start).toBe(span.byteLength);
          expect(vector.expectedBytes.slice(span.start, span.endExclusive)).toBe(span.replacement);
          end = span.endExclusive;
        }
        continue;
      }
      const source = byHash.get(vector.provenance.payloadSha256 ?? "");
      expect(source, `${vector.id}: source observation must remain in the intake`).toBeDefined();
      if (vector.provenance.fidelity === "canonicalized") {
        let expected = source!.rawBytesLatin1;
        expect(vector.provenance.transformations?.length).toBeGreaterThan(0);
        for (const edit of [...vector.provenance.transformations!].sort(
          (a, b) => b.offset - a.offset
        ))
          expected =
            expected.slice(0, edit.offset) +
            edit.insert +
            expected.slice(edit.offset + edit.removeLength);
        expect(vector.expectedBytes).toBe(expected);
      } else {
        expect(vector.expectedBytes).toBe(source?.rawBytesLatin1);
        expect(vector.provenance.fidelity).toBe("unmodified-source");
      }
      expect(vector.provenance.sourceSha256).toBe(source?.sourceSha256);
      expect(vector.provenance.evidenceImageSha256).toBe(source?.imageSha256);
    }
  });

  for (const specimen of specimens) {
    it(`${specimen.id} preserves the independently recovered bytes`, () => {
      const bytes = Buffer.from(specimen.rawBytesLatin1, "latin1");
      expect(bytes.length).toBe(specimen.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(specimen.sha256);
    });

    // Legacy and malformed observations remain available for investigation.
    // Do not assert their current rejection: that would make a future parser
    // improvement fail a test whose only purpose was to preserve source data.
    if (specimen.currentDecoderStatus !== "accepted") continue;

    it(`${specimen.id} decodes the fields read independently from the source bytes`, () => {
      const result = decodeAAMVAFormat(specimen.rawBytesLatin1);
      expect(result.error).toBeUndefined();
      expect(result.data).toMatchObject(specimen.independentExpectedFields);
      expect(result.data?.state).toBe(specimen.jurisdiction);
      expect(result.data?.version).toBe(specimen.rawBytesLatin1.slice(15, 17));
      expect(result.subfiles).toEqual(specimen.independentSubfiles);
    });
  }
});
