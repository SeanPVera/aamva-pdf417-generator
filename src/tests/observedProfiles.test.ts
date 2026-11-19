import { publishedObservations } from "./support/publishedIntake";
import { describe, expect, it } from "vitest";
import intake from "../core/conformance/published/2026-10-25.json";
import profileProvenance from "../core/conformance/observed-profile-provenance.json";
import {
  OBSERVED_ENCODING_PROFILES,
  identifyObservedEncodingProfile
} from "../core/observedProfiles";
import { decodeAAMVAFormat, decodePayload, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";
import { inspectPayload } from "../core/inspect";

// These public layouts carry date-format text in place of date values. Independent
// source bytes control every other byte of the comparison, including padding.
const specimenDateFields: Record<string, string[]> = {
  "ia-dot-mm353-v04": ["DDB"],
  "de-public-specimen-v09": ["DDB"],
  "in-public-specimen-v04": ["DDB"],
  "ms-public-driver-manual-v10": ["DDB"],
  "sd-public-specimen-v04": ["DDB", "DDC"],
  "wv-public-specimen-v09": ["DDB", "DDC"]
};

describe("public-source observed format variants", () => {
  for (const profile of OBSERVED_ENCODING_PROFILES) {
    for (const hash of profileProvenance.find((source) => source.id === profile.id)!
      .sourcePayloadHashes) {
      const specimen = publishedObservations.find((payload) => payload.sha256 === hash)!;
      it(`${profile.id} checks the published wire layout ${hash.slice(0, 12)}`, () => {
        expect(specimen).toBeDefined();
        if (profile.id === "gu-drt-sample-v05") {
          const raw = specimen.rawBytesLatin1;
          expect(raw.slice(235)).toBe("THIS IS JUST SAMPLE DATA ");
          expect(decodeAAMVAFormat(raw).error).toMatch(/Missing segment terminator/);
          expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(false);
          const corrected = raw.slice(0, 27) + "0205" + raw.slice(31, 235) + "\r";
          expect(identifyObservedEncodingProfile(corrected)).toBe(profile.id);
          expect(validateAAMVAPayloadStructure(corrected, true).ok).toBe(true);
          return;
        }
        const decoded = decodeAAMVAFormat(specimen.rawBytesLatin1);
        expect(decoded.error).toBeUndefined();
        const type = decoded.data!.subfileType as "DL" | "ID";
        const fields = getFieldsForStateAndVersion(
          profile.state,
          profile.version,
          type,
          profile.id
        );
        if (profile.id === "id-itd-2011-temporary-v04") {
          const raw = specimen.rawBytesLatin1;
          expect(identifyObservedEncodingProfile(raw)).toBe(profile.id);
          expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(false);
          expect(raw.slice(22, 42)).toBe("DL00410526ZI05670055");
          const encode = (data: Record<string, string>) =>
            generateAAMVAPayload("ID", "04", fields, data, { encodingProfileId: profile.id });
          expect(() => encode(decoded.data!)).toThrow(/DAZ.*DDB.*DDC/);
          // Native page 1 has 525 DL bytes and 55 ZI bytes, after the leading space.
          const replacements = { DAZ: "BRO", DDB: "02012010", DDC: "02012014" };
          let body = raw.slice(42, 567);
          for (const [code, value] of Object.entries(replacements)) {
            const marker = "\n" + code + decoded.data![code] + "\n";
            expect(body.split(marker)).toHaveLength(2);
            body = body.replace(marker, "\n" + code + value + "\n");
          }
          expect(body).toHaveLength(516);
          const expected = raw.slice(1, 22) + "DL00410516ZI05570055" + body + raw.slice(567);
          expect(encode({ ...decoded.data!, ...replacements })).toBe(expected);
          expect(validateAAMVAPayloadStructure(expected, true).ok).toBe(true);
          return;
        }
        if (profile.id === "mi-public-specimen-v10") {
          const raw = specimen.rawBytesLatin1;
          expect(identifyObservedEncodingProfile(raw)).toBe(profile.id);
          const encode = (values: Record<string, string>) =>
            generateAAMVAPayload(profile.state, profile.version, fields, values, {
              subfileType: type,
              encodingProfileId: profile.id
            });
          expect(() => encode(decoded.data!)).toThrow(/Missing mandatory fields/);
          // Replace only the seven intentionally empty spans. Grow the primary
          // directory entry and advance ZM by exactly the length of the inserts.
          const inserts = {
            DCA: "C",
            DCB: "NONE",
            DCD: "NONE",
            DAY: "BLU",
            DAU: "070 IN",
            DCF: "TEST1234",
            DCG: "USA"
          };
          let expected = raw;
          for (const [code, value] of Object.entries(inserts)) {
            const marker = "\n" + code + "\n";
            expect(expected.split(marker)).toHaveLength(2);
            expected = expected.replace(marker, "\n" + code + value + "\n");
          }
          const growth = expected.length - raw.length;
          const width4 = (n: number) => String(n).padStart(4, "0");
          expect(raw.slice(21, 41)).toBe("DL00410243ZM02840009");
          expected =
            expected.slice(0, 27) +
            width4(243 + growth) +
            "ZM" +
            width4(284 + growth) +
            expected.slice(37);
          expect(encode({ ...decoded.data!, ...inserts })).toBe(expected);
          expect(validateAAMVAPayloadStructure(expected, true).ok).toBe(true);
          return;
        }
        const dateFields = specimenDateFields[profile.id];
        if (dateFields) {
          expect(identifyObservedEncodingProfile(specimen.rawBytesLatin1)).toBe(profile.id);
          for (const code of dateFields) expect(decoded.data![code]).toBe("MMDDCCYY");
          expect(() =>
            generateAAMVAPayload(profile.state, profile.version, fields, decoded.data!, {
              subfileType: type,
              encodingProfileId: profile.id
            })
          ).toThrow(/Card Revision Date/);
          for (const numericDate of ["01012020", "12022021"]) {
            const input = { ...decoded.data! };
            let expected = specimen.rawBytesLatin1;
            for (const code of dateFields) {
              const marker = "\n" + code + "MMDDCCYY";
              expect(expected.split(marker)).toHaveLength(2);
              expected = expected.replace(marker, "\n" + code + numericDate);
              input[code] = numericDate;
            }
            expect(
              generateAAMVAPayload(profile.state, profile.version, fields, input, {
                subfileType: type,
                encodingProfileId: profile.id
              })
            ).toBe(expected);
            expect(validateAAMVAPayloadStructure(expected, true).ok).toBe(true);
          }
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
        } else if (profile.id === "nj-training-previous-v04") {
          const raw = specimen.rawBytesLatin1;
          expect(raw.slice(31, 41)).toBe("ZN03560131");
          expect(decoded.data!.DDA).toBe("B");
          expect(validateAAMVAPayloadStructure(raw, true).ok).toBe(false);
          expect(result).toBe(raw.slice(0, 37) + "0132" + raw.slice(41) + "\r");
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
  it("recognizes the two documented Georgia secondary layouts and rejects a partial suffix", () => {
    const raw = publishedObservations.find((p) =>
      p.sha256.startsWith("47ddb17df100")
    )!.rawBytesLatin1;
    const shorter = publishedObservations.find((p) =>
      p.sha256.startsWith("be90490c2643")
    )!.rawBytesLatin1;
    for (const source of [raw, shorter]) {
      expect(identifyObservedEncodingProfile(source)).toBe("ga-2012-version06");
    }
    // Remove only the last secondary element and correct the length in the directory.
    const partial = raw.replace(/\nZGL[^\n\r]*/, "");
    const length = Number(raw.slice(37, 41)) - (raw.length - partial.length);
    const updated = partial.slice(0, 37) + String(length).padStart(4, "0") + partial.slice(41);
    expect(validateAAMVAPayloadStructure(updated, true).ok).toBe(true);
    expect(identifyObservedEncodingProfile(updated)).toBeUndefined();
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
