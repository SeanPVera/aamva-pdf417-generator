import { describe, it, expect } from "vitest";
import {
  BARCODE_DIMENSIONS,
  DEFAULT_BARCODE_DIMENSIONS,
  getBarcodeDimensions
} from "../core/barcodeDimensions";
import { AAMVA_STATES } from "../core/states";

describe("barcodeDimensions", () => {
  it("falls back to AAMVA-standard dimensions for unknown jurisdictions", () => {
    expect(getBarcodeDimensions("ZZ")).toEqual(DEFAULT_BARCODE_DIMENSIONS);
  });

  it("returns the override entry when one exists", () => {
    expect(getBarcodeDimensions("CA")).toEqual(BARCODE_DIMENSIONS.CA);
  });

  it("returns the default for jurisdictions without an override", () => {
    expect(getBarcodeDimensions("WY")).toEqual(DEFAULT_BARCODE_DIMENSIONS);
  });

  it("uses positive width and height for every override", () => {
    for (const [code, dim] of Object.entries(BARCODE_DIMENSIONS)) {
      expect(dim.widthInches, `${code} width`).toBeGreaterThan(0);
      expect(dim.heightInches, `${code} height`).toBeGreaterThan(0);
    }
  });

  it("keeps overrides within plausible CR80 credential bounds", () => {
    // CR80 cards are 3.375" x 2.125"; the PDF417 area must fit within them.
    for (const [code, dim] of Object.entries(BARCODE_DIMENSIONS)) {
      expect(dim.widthInches, `${code} width`).toBeLessThanOrEqual(3.375);
      expect(dim.heightInches, `${code} height`).toBeLessThanOrEqual(2.125);
    }
  });

  it("limits overrides to recognized jurisdictions", () => {
    for (const code of Object.keys(BARCODE_DIMENSIONS)) {
      expect(AAMVA_STATES, `${code} should be a known jurisdiction`).toHaveProperty(code);
    }
  });
});
