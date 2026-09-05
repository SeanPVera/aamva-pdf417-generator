import { test, expect, type Page } from "@playwright/test";
import { dismissTour } from "./helpers";

/**
 * The header's identity row is painted with the jurisdiction colour, and its
 * controls take `--state-on-primary`. Every one of the 54 palettes sets that to
 * #ffffff.
 *
 * A popover anchored to one of those controls is not on that surface — it
 * paints its own white panel. While the themed rule in index.css selected a
 * bare `button`, it reached through the wrapper and repainted every menu item
 * white-on-white: 1.00:1, five controls rendering as blank rows on every phone,
 * on every jurisdiction. The stylesheet test cannot see this — the colours only
 * exist once a palette is applied — so it is measured here.
 */

const AA_NORMAL = 4.5;

/** WCAG contrast of an element against the first painted background above it. */
async function contrastOf(page: Page, handle: string, index: number): Promise<number> {
  return page.evaluate(
    ({ sel, i }) => {
      const el = document.querySelectorAll(sel)[i];
      if (!el) throw new Error(`no element ${i} for ${sel}`);

      const parse = (value: string): [number, number, number] => {
        const nums = (value.match(/[\d.]+/g) ?? []).map(Number);
        const scale = value.startsWith("color(") ? 255 : 1;
        return [(nums[0] ?? 0) * scale, (nums[1] ?? 0) * scale, (nums[2] ?? 0) * scale];
      };

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
    },
    { sel: handle, i: index }
  );
}

const ITEMS = '[role="menu"] [role="menuitem"], [role="menu"] [role="menuitemcheckbox"]';

async function everyItemIsLegible(page: Page, label: string) {
  const items = page.locator(ITEMS);
  const count = await items.count();
  expect(count, `${label} rendered no items`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const text = (await items.nth(i).innerText()).trim().replace(/\s+/g, " ");
    expect(await contrastOf(page, ITEMS, i), `${label} → "${text}"`).toBeGreaterThanOrEqual(
      AA_NORMAL
    );
  }
}

test.describe("header popovers on a phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");
    await dismissTour(page);
  });

  test("the More actions menu is readable", async ({ page }) => {
    await page.getByRole("button", { name: /more actions/i }).click();
    await everyItemIsLegible(page, "More actions");
  });

  test("the playful extras menu is reachable and readable", async ({ page }) => {
    // It used to live in the action bar, which is `hidden lg:flex` — so the
    // whimsy toggles, the badge case, DMV Bingo and the road test were simply
    // gone below 1024px. Reaching it at all is half of what this asserts.
    await page.getByRole("button", { name: /toggle playful extras/i }).click();
    await expect(page.getByRole("menuitem", { name: /take the road test/i })).toBeVisible();
    await everyItemIsLegible(page, "Playful extras");
  });
});
