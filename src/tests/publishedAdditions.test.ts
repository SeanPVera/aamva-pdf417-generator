import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import additions from "../core/conformance/published/2026-10-31.json";
import original from "../core/conformance/published/2026-10-25.json";
import continuation from "../core/conformance/published/2026-10-31-continuation.json";
import provenance from "../core/conformance/observed-profile-provenance.json";
import { OBSERVED_ENCODING_PROFILES } from "../core/observedProfiles";
import { decodeAAMVAFormat } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";
import { loadVectors } from "./support/conformanceVectors";

const acquisitions = [...additions.payloads, ...additions.reobservations];

describe("October 31 public-source acquisition", () => {
  it("records each additional observation once and retains source-file identity", () => {
    expect(additions.payloads).toHaveLength(9);
    expect(additions.reobservations).toHaveLength(1);
    expect(
      new Set([...original.payloads, ...additions.payloads].map((payload) => payload.sha256)).size
    ).toBe(35);
    expect(new Set(additions.payloads.map((payload) => payload.sha256)).size).toBe(9);
    const sources = new Map(additions.sources.map((source) => [source.id, source]));
    for (const payload of acquisitions) {
      expect(sources.get(payload.sourceId)?.sha256).toBe(payload.sourceSha256);
      expect(payload.sourcePage).toBeGreaterThan(0);
      expect(payload.imageSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(payload.sourceUrl).toMatch(/^https:\/\//);
    }
  });
  for (const payload of acquisitions) {
    it(`${payload.id} preserves independently scanned bytes and field assertions`, () => {
      const bytes = Buffer.from(payload.rawBytesLatin1, "latin1");
      expect(bytes.length).toBe(payload.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(payload.sha256);
      if (payload.currentDecoderStatus !== "accepted") return;
      const decoded = decodeAAMVAFormat(payload.rawBytesLatin1);
      expect(decoded.error).toBeUndefined();
      expect(decoded.data).toMatchObject(payload.independentExpectedFields);
      expect(decoded.data?.state).toBe(payload.jurisdiction);
    });
  }
  it("quarantines inconsistent publisher identity and non-AAMVA example text", () => {
    const hawaii = additions.payloads.find((payload) => payload.jurisdiction === "HI")!;
    expect(hawaii.rawBytesLatin1.slice(9, 15)).toBe("636039");
    expect(decodeAAMVAFormat(hawaii.rawBytesLatin1).data?.state).not.toBe("HI");
    const dc = additions.payloads.find((payload) => payload.jurisdiction === "DC")!;
    expect(decodeAAMVAFormat(dc.rawBytesLatin1).error).toBeTruthy();
    for (const payload of [hawaii, dc]) {
      expect(
        loadVectors().some((vector) => vector.provenance.payloadSha256 === payload.sha256)
      ).toBe(false);
    }
  });
  for (const state of ["MS", "MI", "IN", "DE"]) {
    it(`${state} retains its published defects as negative encoder evidence`, () => {
      const source = [...original.payloads, ...additions.payloads].find(
        (payload) => payload.jurisdiction === state
      )!;
      const decoded = decodeAAMVAFormat(source.rawBytesLatin1).data!;
      const type = decoded.subfileType as "DL" | "ID";
      expect(() =>
        generateAAMVAPayload(
          state,
          decoded.version!,
          getFieldsForStateAndVersion(state, decoded.version!, type),
          decoded,
          { subfileType: type }
        )
      ).toThrow(state === "MI" ? /Missing mandatory/ : /Card Revision Date/);
    });
  }
  it("links runtime observed profiles to retained evidence without shipping hashes in the UI bundle", () => {
    expect(provenance.map((source) => source.id).sort()).toEqual(
      OBSERVED_ENCODING_PROFILES.map((profile) => profile.id).sort()
    );
    const observations = [...original.payloads, ...additions.payloads, ...continuation.payloads];
    for (const source of provenance) {
      for (const hash of source.sourcePayloadHashes)
        expect(observations.some((payload) => payload.sha256 === hash)).toBe(true);
      for (const record of source.sourceRecords)
        expect(
          observations.find((payload) => payload.sha256 === record.payloadSha256)?.sourceSha256
        ).toBe(record.sourceSha256);
    }
  });
});
