import { describe, it, expect } from "vitest";
import { getReadableTextColor, getPaletteForState } from "../core/stateThemes";

describe("stateThemes", () => {
  describe("getReadableTextColor", () => {
    it("returns dark text for light backgrounds", () => {
      expect(getReadableTextColor("#ffffff")).toBe("#111827");
      expect(getReadableTextColor("#f6c343")).toBe("#111827");
    });

    it("returns light text for dark backgrounds", () => {
      expect(getReadableTextColor("#003f87")).toBe("#ffffff");
      expect(getReadableTextColor("#111111")).toBe("#ffffff");
    });

    it("accepts colors without # prefix", () => {
      expect(getReadableTextColor("ffffff")).toBe("#111827");
    });

    it("falls back to light text for invalid colors", () => {
      expect(getReadableTextColor("not-a-color")).toBe("#ffffff");
    });
  });

  describe("getPaletteForState", () => {
    it("includes white accent states from palette map", () => {
      expect(getPaletteForState("AL").accent).toBe("#ffffff");
      expect(getPaletteForState("SC").accent).toBe("#ffffff");
      expect(getPaletteForState("WY").accent).toBe("#ffffff");
      expect(getPaletteForState("DC").accent).toBe("#ffffff");
    });
  });
});
