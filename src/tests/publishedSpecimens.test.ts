import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { decodeAAMVAFormat } from "../core/decoder";
import intakeData from "../core/conformance/published/2026-10-25.json";
import additions from "../core/conformance/published/2026-10-31.json";
import continuation from "../core/conformance/published/2026-10-31-continuation.json";
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
    const byHash = new Map(
      [...specimens, ...additions.payloads, ...continuation.payloads].map((specimen) => [
        specimen.sha256,
        specimen
      ])
    );
    for (const vector of loadVectors().filter((entry) => entry.provenance.tier === "published")) {
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
