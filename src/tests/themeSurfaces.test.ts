import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STATE_THEMES, DEFAULT_STATE_THEME } from "../core/stateThemes";

/**
 * `applyStateThemeToDocument` sets `data-state-theme` on <html> for every
 * jurisdiction — in dark mode too, because the jurisdiction and the light/dark
 * preference are independent choices. Every palette in stateThemes.ts is built
 * from light tints, so any `html[data-state-theme]` rule that paints a surface
 * with one of them has to be scoped away from `html.dark`. When it was not,
 * the form's text boxes rendered near-white fills under the near-white text
 * that `html.dark` had already chosen: about 1.05:1, unreadable.
 *
 * These tests read the stylesheet as text rather than through a browser. The
 * point is the scoping rule, not the rendered pixels — the pixels are checked
 * in the Playwright suite.
 */
const CSS = readFileSync(resolve(__dirname, "../styles/index.css"), "utf8");

/** Splits the sheet into `{ selector, body }` pairs, ignoring at-rule wrappers. */
function rules(): Array<{ selector: string; body: string }> {
  const out: Array<{ selector: string; body: string }> = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(CSS))) {
    const selector = (m[1] ?? "").trim();
    // `@media`/`@keyframes` openers and keyframe stops are not style rules.
    if (!selector || selector.startsWith("@") || /^\d|^(from|to)$/.test(selector)) continue;
    out.push({ selector, body: m[2] ?? "" });
  }
  return out;
}

/** Light-tint custom properties — safe on white, never behind light text. */
const LIGHT_SURFACE_VARS = [
  "--state-surface",
  "--state-surface-alt",
  "--state-background",
  "--state-input",
  "--state-secondary",
  "--state-tint",
  "--state-border"
];

describe("state theme surfaces vs. dark mode", () => {
  const themed = rules().filter((r) => r.selector.includes("[data-state-theme]"));

  it("finds the jurisdiction surface rules it is meant to police", () => {
    expect(themed.length).toBeGreaterThan(5);
  });

  for (const variable of LIGHT_SURFACE_VARS) {
    it(`only paints with ${variable} outside dark mode`, () => {
      const offenders = themed
        .filter((r) => r.body.includes(`var(${variable})`))
        .filter((r) => /background|border-color/.test(r.body))
        // Either scoped away from dark mode, or explicitly a dark-mode rule
        // that has chosen the value deliberately.
        .filter((r) => !r.selector.includes(":not(.dark)") && !r.selector.includes(".dark"))
        .map((r) => r.selector);

      expect(offenders, `unscoped light surfaces: ${offenders.join(" | ")}`).toEqual([]);
    });
  }

  it("gives dark mode its own fill for the form's text boxes", () => {
    const darkInputFill = themed.find(
      (r) =>
        r.selector.includes(".dark") &&
        !r.selector.includes(":not(.dark)") &&
        r.selector.includes("input") &&
        r.body.includes("background-color")
    );
    expect(darkInputFill).toBeDefined();
    // The jurisdiction hue is mixed into a dark base rather than replacing it.
    expect(darkInputFill?.body).toMatch(/color-mix\(.*#[0-9a-f]{6}/i);
  });

  it("never repaints a form field's border, which carries validation state", () => {
    // `border-color: ... !important` on `.dmv-main input` overrode the red and
    // amber edges the validator sets, so an invalid field looked like a valid
    // one wearing the state's colors.
    const offenders = themed
      .filter((r) => /\.dmv-main\s+(input|select|textarea)/.test(r.selector))
      .filter((r) => /(^|[^-])border-color/.test(r.body))
      .map((r) => r.selector);

    expect(offenders, `form fields with a themed border: ${offenders.join(" | ")}`).toEqual([]);
  });

  it("every palette really is light, which is why the scoping matters", () => {
    // Guards the assumption above: if a palette ever ships a dark `surface`,
    // these tests are policing the wrong thing and should be revisited.
    const luminance = (hex: string) => {
      const n = parseInt(hex.replace("#", ""), 16);
      const ch = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * ch((n >> 16) & 0xff) + 0.7152 * ch((n >> 8) & 0xff) + 0.0722 * ch(n & 0xff);
    };

    for (const theme of [DEFAULT_STATE_THEME, ...Object.values(STATE_THEMES)]) {
      expect(luminance(theme.input)).toBeGreaterThan(0.5);
      expect(luminance(theme.surface)).toBeGreaterThan(0.5);
    }
  });
});
