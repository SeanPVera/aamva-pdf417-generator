import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const css = readFileSync(resolve(__dirname, "../styles/index.css"), "utf8");
function tokens(selector: string) {
  const body = css.slice(css.indexOf(selector)).split("}")[0]!;
  return Object.fromEntries(
    [...body.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]])
  );
}
function luminance(hex: string) {
  const c = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe("workbench semantic palette", () => {
  for (const selector of [":root {", "html.dark {"]) {
    it(`${selector} keeps text and semantic colors legible on both surfaces`, () => {
      const palette = tokens(selector);
      for (const foreground of [
        "ink",
        "secondary",
        "muted",
        "accent",
        "success",
        "warning",
        "error"
      ])
        for (const background of ["paper", "surface"]) {
          expect(
            contrast(palette[foreground]!, palette[background]!),
            `${foreground} / ${background}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      expect(contrast(palette["control-border"]!, palette.surface!)).toBeGreaterThanOrEqual(3);
    });
  }
  it("never applies issuer palette overrides to form validation borders", () => {
    expect(css).not.toContain("html[data-state-theme]");
    expect(css).not.toMatch(/border-color:[^;}]+!important/);
  });
});
