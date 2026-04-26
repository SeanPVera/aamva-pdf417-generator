import { describe, expect, it } from "vitest";
import bwipjs from "bwip-js";
import { jsPDF } from "jspdf";

import { decodeAAMVAFormat, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";
import { AAMVA_STATES, isJurisdictionSupported } from "../core/states";
import { ALL_QA_FIXTURES, QA_FIXTURES, VERSION_MATRIX_01_TO_10 } from "./fixtures/aamvaFixtures";

describe("AAMVA QA / conformance fixtures", () => {
  it("enforces synthetic-only markers across all fixtures", () => {
    for (const fixture of ALL_QA_FIXTURES) {
      expect(fixture.syntheticOnly).toBe(true);
      const text = JSON.stringify(fixture.data);
      expect(text).toMatch(/TEST/i);
      expect(text).not.toMatch(/JOHN\s+DOE|JANE\s+DOE|MAIN\s+STREET/i);
    }
  });

  it("maintains explicit version matrix for 01-10 coverage and support", () => {
    const coveredVersions = new Set(QA_FIXTURES.golden.map((fixture) => fixture.version));

    for (const entry of VERSION_MATRIX_01_TO_10) {
      if (entry.supportedByGenerator) {
        expect(coveredVersions.has(entry.version)).toBe(true);
        expect(entry.fixtureCount).toBeGreaterThan(0);
      } else {
        expect(entry.fixtureCount).toBe(0);
      }
    }
  });

  it("covers all supported jurisdictions with at least one fixture", () => {
    const supported = Object.keys(AAMVA_STATES).filter((state) => isJurisdictionSupported(state));
    const covered = new Set(QA_FIXTURES.jurisdiction.map((fixture) => fixture.jurisdiction));

    for (const state of supported) {
      expect(covered.has(state)).toBe(true);
    }
  });

  it("valid fixtures pass payload generation and decoder round trips", () => {
    const validFixtures = ALL_QA_FIXTURES.filter((fixture) => fixture.expectations.valid);

    for (const fixture of validFixtures) {
      const fields = getFieldsForStateAndVersion(fixture.jurisdiction, fixture.version);
      const payload = generateAAMVAPayload(
        fixture.jurisdiction,
        fixture.version,
        fields,
        { ...fixture.data },
        fixture.options
      );

      const structure = validateAAMVAPayloadStructure(payload);
      expect(structure.ok, fixture.id).toBe(true);

      if (fixture.expectations.payloadContains) {
        for (const chunk of fixture.expectations.payloadContains) {
          expect(payload).toContain(chunk);
        }
      }

      if (fixture.expectations.payloadDoesNotContain) {
        for (const chunk of fixture.expectations.payloadDoesNotContain) {
          expect(payload).not.toContain(chunk);
        }
      }

      if (fixture.expectations.roundTripDecode) {
        const decoded = decodeAAMVAFormat(payload);
        expect(decoded.error, fixture.id).toBeUndefined();
        expect(decoded.data?.version).toBe(fixture.version);
        expect(decoded.data?.state).toBe(fixture.jurisdiction);
        expect(JSON.stringify(decoded.data)).toMatch(/TEST/);
      }
    }
  });

  it("negative fixtures fail in expected ways", () => {
    const negativeFixtures = ALL_QA_FIXTURES.filter((fixture) => !fixture.expectations.valid);

    for (const fixture of negativeFixtures) {
      const fields = getFieldsForStateAndVersion(fixture.jurisdiction, fixture.version);
      try {
        generateAAMVAPayload(fixture.jurisdiction, fixture.version, fields, { ...fixture.data });
        throw new Error(`Fixture ${fixture.id} unexpectedly passed`);
      } catch (error) {
        const message = String((error as Error).message || "");
        for (const needle of fixture.expectations.expectedErrorIncludes ?? []) {
          expect(message).toContain(needle);
        }
      }
    }
  });

  it("scanner behavior: payload tolerates trailing newline from scanners", () => {
    const fixture = QA_FIXTURES.golden.find((entry) => entry.version === "10")!;
    const fields = getFieldsForStateAndVersion(fixture.jurisdiction, fixture.version);
    const payload = generateAAMVAPayload(fixture.jurisdiction, fixture.version, fields, {
      ...fixture.data
    });

    const scannedText = `${payload}\n`;
    const decoded = decodeAAMVAFormat(scannedText);

    expect(decoded.error).toBeUndefined();
    expect(JSON.stringify(decoded.data)).toContain("TEST");
  });

  it("export integrity: PNG, SVG, and PDF artifacts are non-empty", async () => {
    const fixture = QA_FIXTURES.golden.find((entry) => entry.version === "10")!;
    const fields = getFieldsForStateAndVersion(fixture.jurisdiction, fixture.version);
    const payload = generateAAMVAPayload(fixture.jurisdiction, fixture.version, fields, {
      ...fixture.data
    });

    const pngBuffer = await bwipjs.toBuffer({
      bcid: "pdf417",
      text: payload,
      scale: 2,
      height: 20,
      includetext: false
    });

    expect(pngBuffer.length).toBeGreaterThan(100);

    const svgText = bwipjs.toSVG({
      bcid: "pdf417",
      text: payload,
      scale: 2,
      height: 20,
      includetext: false
    });

    expect(svgText.length).toBeGreaterThan(100);
    expect(svgText.startsWith("<svg")).toBe(true);

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pngDataUri = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    pdf.addImage(pngDataUri, "PNG", 36, 36, 360, 100);
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    expect(pdfBuffer.byteLength).toBeGreaterThan(100);
  });
});
