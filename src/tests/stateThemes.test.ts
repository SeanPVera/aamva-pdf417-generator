import { describe, it, expect, beforeEach } from "vitest";
import {
  STATE_THEMES,
  DEFAULT_STATE_THEME,
  getStateTheme,
  applyStateThemeToDocument
} from "../core/stateThemes";
import { AAMVA_STATES } from "../core/states";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

describe("State themes", () => {
  it("exposes a palette for every jurisdiction in AAMVA_STATES", () => {
    for (const code of Object.keys(AAMVA_STATES)) {
      expect(STATE_THEMES[code], `missing palette for ${code}`).toBeDefined();
    }
  });

  it("every palette has the six required fields as valid hex colors", () => {
    for (const [code, palette] of Object.entries(STATE_THEMES)) {
      for (const key of [
        "primary",
        "primaryDark",
        "accent",
        "onPrimary",
        "onAccent",
        "tint"
      ] as const) {
        expect(palette[key], `${code}.${key} missing`).toBeDefined();
        expect(palette[key], `${code}.${key} not valid hex (${palette[key]})`).toMatch(HEX_COLOR);
      }
    }
  });

  it("getStateTheme returns the matching palette for a known state", () => {
    const ca = getStateTheme("CA");
    expect(ca).toEqual(STATE_THEMES.CA);
  });

  it("getStateTheme falls back to the default palette for unknown codes", () => {
    expect(getStateTheme("ZZ")).toEqual(DEFAULT_STATE_THEME);
    expect(getStateTheme("")).toEqual(DEFAULT_STATE_THEME);
  });

  describe("applyStateThemeToDocument", () => {
    beforeEach(() => {
      document.documentElement.removeAttribute("style");
      document.documentElement.removeAttribute("data-state");
    });

    it("sets all six CSS custom properties on <html>", () => {
      applyStateThemeToDocument("TX");
      const root = document.documentElement;
      const tx = STATE_THEMES.TX;
      expect(root.style.getPropertyValue("--state-primary")).toBe(tx.primary);
      expect(root.style.getPropertyValue("--state-primary-dark")).toBe(tx.primaryDark);
      expect(root.style.getPropertyValue("--state-accent")).toBe(tx.accent);
      expect(root.style.getPropertyValue("--state-on-primary")).toBe(tx.onPrimary);
      expect(root.style.getPropertyValue("--state-on-accent")).toBe(tx.onAccent);
      expect(root.style.getPropertyValue("--state-tint")).toBe(tx.tint);
    });

    it("records the active state code via data-state attribute", () => {
      applyStateThemeToDocument("NY");
      expect(document.documentElement.getAttribute("data-state")).toBe("NY");
    });

    it("updates CSS variables when switching between states", () => {
      applyStateThemeToDocument("CA");
      const after1 = document.documentElement.style.getPropertyValue("--state-primary");
      applyStateThemeToDocument("FL");
      const after2 = document.documentElement.style.getPropertyValue("--state-primary");
      expect(after1).toBe(STATE_THEMES.CA.primary);
      expect(after2).toBe(STATE_THEMES.FL.primary);
      expect(after1).not.toBe(after2);
    });

    it("applies the default palette for an unknown jurisdiction", () => {
      applyStateThemeToDocument("XX");
      expect(document.documentElement.style.getPropertyValue("--state-primary")).toBe(
        DEFAULT_STATE_THEME.primary
      );
    });
  });
});
