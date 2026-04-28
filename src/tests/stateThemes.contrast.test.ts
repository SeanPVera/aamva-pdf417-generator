import { describe, it, expect } from "vitest";
import { STATE_THEMES, DEFAULT_STATE_THEME, type StateTheme } from "../core/stateThemes";

// WCAG 2.1 contrast computation (sRGB -> linear -> relative luminance -> ratio).
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(hexToRgb(fg));
  const L2 = relativeLuminance(hexToRgb(bg));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0; // Large text or non-text UI components.

function checkPalette(theme: StateTheme): { primary: number; accent: number } {
  return {
    primary: contrastRatio(theme.onPrimary, theme.primary),
    accent: contrastRatio(theme.onAccent, theme.accent)
  };
}

describe("state themes WCAG AA contrast", () => {
  it("DEFAULT_STATE_THEME meets AA for both surface pairs", () => {
    const ratios = checkPalette(DEFAULT_STATE_THEME);
    expect(ratios.primary).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    expect(ratios.accent).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  for (const [code, theme] of Object.entries(STATE_THEMES)) {
    it(`${code} primary surface meets AA-normal contrast`, () => {
      const r = contrastRatio(theme.onPrimary, theme.primary);
      // Header surfaces use this pairing; require full AA.
      expect(r, `${code} onPrimary on primary`).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it(`${code} accent surface meets AA-large contrast`, () => {
      const r = contrastRatio(theme.onAccent, theme.accent);
      // Accents are typically used for badges/buttons (large text or UI
      // components), so AA-large (3.0) is the right floor.
      expect(r, `${code} onAccent on accent`).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });
  }
});
