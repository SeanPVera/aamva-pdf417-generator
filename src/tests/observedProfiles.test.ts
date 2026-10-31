import { describe, expect, it } from "vitest";
import intake from "../core/conformance/published/2026-10-25.json";
import additions from "../core/conformance/published/2026-10-31.json";
import profileProvenance from "../core/conformance/observed-profile-provenance.json";
import {
  OBSERVED_ENCODING_PROFILES,
  identifyObservedEncodingProfile
} from "../core/observedProfiles";
import { decodeAAMVAFormat, decodePayload, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";
import { inspectPayload } from "../core/inspect";

describe("public-source observed format variants", () => {
  for (const profile of OBSERVED_ENCODING_PROFILES) {
    for (const hash of profileProvenance.find((source) => source.id === profile.id)!
      .sourcePayloadHashes) {
      const specimen = [...intake.payloads, ...additions.payloads].find(
        (payload) => payload.sha256 === hash
      )!;
      it(`${profile.id} reproduces independently decoded ${hash.slice(0, 12)} bytes`, () => {
        expect(specimen).toBeDefined();
        const decoded = decodeAAMVAFormat(specimen.rawBytesLatin1);
        expect(decoded.error).toBeUndefined();
        const type = decoded.data!.subfileType as "DL" | "ID";
        const fields = getFieldsForStateAndVersion(
          profile.state,
          profile.version,
          type,
          profile.id
        );
        if (profile.id === "ms-public-driver-manual-v10") {
          expect(decoded.data!.DDB).toBe("MMDDCCYY");
          expect(() =>
            generateAAMVAPayload(profile.state, profile.version, fields, decoded.data!, {
              subfileType: type,
              encodingProfileId: profile.id
            })
          ).toThrow(/Card Revision Date/);
          return;
        }
        const result = generateAAMVAPayload(profile.state, profile.version, fields, decoded.data!, {
          subfileType: type,
          encodingProfileId: profile.id
        });
        if (profile.id === "pa-published-v08") {
          const raw = specimen.rawBytesLatin1;
          const repaired = raw.replace("\rZPD", "ZPD");
          const expected =
            repaired.slice(0, 37) +
            String(Number(raw.slice(37, 41)) - 1).padStart(4, "0") +
            repaired.slice(41);
          expect(result).toBe(expected);
          expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(false);
          expect(validateAAMVAPayloadStructure(result, true).ok).toBe(true);
          expect(decoded.diagnostics?.some((message) => message.includes("Interior segment"))).toBe(
            true
          );
        } else if (profile.id === "sc-public-retailer-legacy-v01") {
          const raw = specimen.rawBytesLatin1;
          expect(result).toBe(
            raw.slice(0, 2) + "\x1e" + raw.slice(3, 21) + "00290203" + raw.slice(29)
          );
          expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(false);
          expect(validateAAMVAPayloadStructure(result, true).ok).toBe(true);
        } else expect(result).toBe(specimen.rawBytesLatin1);
        expect(identifyObservedEncodingProfile(specimen.rawBytesLatin1)).toBe(profile.id);
      });
    }
  }
  it("refuses an observed profile on the wrong issuer, edition, or document type", () => {
    expect(() => getFieldsForStateAndVersion("CA", "10", "DL", "va-2023-revision02")).toThrow(
      /does not match/
    );
    expect(() => getFieldsForStateAndVersion("VA", "12", "DL", "va-2023-revision02")).toThrow(
      /does not match/
    );
    expect(() => getFieldsForStateAndVersion("GA", "06", "ID", "ga-2012-version06")).toThrow(
      /does not match/
    );
  });
  it("keeps modern generic ID rules independent of the Virginia specimen exception", () => {
    expect(
      getFieldsForStateAndVersion("VA", "10", "ID").some((field) => field.code === "DCA")
    ).toBe(false);
    expect(
      getFieldsForStateAndVersion("VA", "10", "ID", "va-2023-revision02").some(
        (field) => field.code === "DCA"
      )
    ).toBe(true);
  });
  it("only recognizes source layouts when issuer and padded widths agree", () => {
    const source = intake.payloads.find(
      (payload) => payload.id === "va-published-093b70f9cd7e"
    )!.rawBytesLatin1;
    expect(identifyObservedEncodingProfile(source.replace("636000", "636014"))).toBeUndefined();
    expect(identifyObservedEncodingProfile(source.replace("DCADM2 ", "DCADM2"))).toBeUndefined();
  });
});

describe("legacy and transport compatibility with preserved raw evidence", () => {
  for (const prefix of ["488fa2962926", "1a6e922373c1", "0c47325e2b05"]) {
    const specimen = intake.payloads.find((payload) => payload.sha256.startsWith(prefix))!;
    it(`${specimen.id} exposes compatibility diagnostics`, () => {
      const text = specimen.rawBytesLatin1;
      const decoded = decodePayload(text);
      expect(decoded.error).toBeUndefined();
      expect(decoded.data?.state).toBe(specimen.jurisdiction);
      expect(decoded.diagnostics?.length).toBeGreaterThan(0);
      const inspected = inspectPayload(text);
      expect(inspected.error).toBeUndefined();
      expect(inspected.inspection?.totalBytes).toBe(specimen.byteLength);
      expect(inspected.inspection?.diagnostics?.length).toBeGreaterThan(0);
      if (prefix !== "488fa2962926")
        expect(validateAAMVAPayloadStructure(text, true).ok).toBe(false);
      expect(text).toBe(specimen.rawBytesLatin1);
    });
  }
  it("continues to report malformed two-character jurisdiction elements", () => {
    const bad = intake.payloads.find((payload) => payload.sha256.startsWith("1e3c7419dcd6"))!;
    expect(decodeAAMVAFormat(bad.rawBytesLatin1).error).toMatch(/Malformed data element/);
  });
});
