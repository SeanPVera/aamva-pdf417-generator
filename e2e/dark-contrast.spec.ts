import { test, expect, type Page } from "@playwright/test";
import { dismissTour, ensurePanel, fillField, selectState } from "./helpers";

/**
 * The jurisdiction palettes are all light tints, and `data-state-theme` is set
 * on <html> whatever the color scheme is. When the themed surface rules were
 * not scoped away from `html.dark`, dark mode rendered near-white panels and
 * near-white text boxes underneath the near-white text `html.dark` had already
 * chosen — the form's own inputs sat at roughly 1.05:1.
 *
 * The unit suite guards the CSS scoping as source text; this measures what the
 * browser actually paints, which is the part that matters and the part the
 * stylesheet test cannot see through `color-mix`.
 */
test.use({ colorScheme: "dark" });

const AA_NORMAL = 4.5;

/** WCAG relative luminance from a computed `rgb()` / `color(srgb ...)` string. */
async function contrastOf(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`no element for ${sel}`);

    const parse = (value: string): [number, number, number] => {
      const nums = (value.match(/[\d.]+/g) ?? []).map(Number);
      // `color(srgb r g b)` reports 0..1 channels; `rgb()` reports 0..255.
      const scale = value.startsWith("color(") ? 255 : 1;
      return [(nums[0] ?? 0) * scale, (nums[1] ?? 0) * scale, (nums[2] ?? 0) * scale];
    };

    // Walk up for the first non-transparent background, the way a reader's eye
    // does — an input with no fill of its own shows the panel behind it.
    let node: Element | null = el;
    let background: [number, number, number] = [255, 255, 255];
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const alpha = Number((bg.match(/[\d.]+/g) ?? [])[3] ?? 1);
      if (bg !== "transparent" && alpha > 0) {
        background = parse(bg);
        break;
      }
      node = node.parentElement;
    }

    const luminance = ([r, g, b]: [number, number, number]) => {
      const ch = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    };

    const fg = luminance(parse(getComputedStyle(el).color));
    const bg = luminance(background);
    const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
    return (hi + 0.05) / (lo + 0.05);
  }, selector);
}

test.describe("dark mode readability under a jurisdiction theme", () => {
  test("form text boxes keep their text legible against the themed fill", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");
    await fillField(page, "DCS", "MORALES");

    expect(await contrastOf(page, "#DCS")).toBeGreaterThanOrEqual(AA_NORMAL);
    // The label sits on the same fill and is rendered at ~10.5px.
    expect(await contrastOf(page, 'label[for="DCS"]')).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  test("the panel headings stay legible", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    expect(await contrastOf(page, ".dmv-main h2")).toBeGreaterThanOrEqual(AA_NORMAL);
    await ensurePanel(page, "config");
    expect(await contrastOf(page, ".dmv-sidebar h2")).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  test("holds across jurisdictions with very different palettes", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    // WA is a dark green, FL a bright red, NY a navy — the mix that produces
    // the field fill has to stay dark for all of them.
    for (const state of ["WA", "FL", "NY"]) {
      await selectState(page, state);
      await ensurePanel(page, "form");
      await fillField(page, "DCS", "MORALES");
      expect(await contrastOf(page, "#DCS"), `${state} field text`).toBeGreaterThanOrEqual(
        AA_NORMAL
      );
    }
  });
});
