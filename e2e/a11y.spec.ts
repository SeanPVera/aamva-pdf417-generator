import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissTour, ensurePanel } from "./helpers";

test.describe("accessibility", () => {
  test("homepage has no axe violations on WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Color-contrast violations on the dynamic state themes are tracked
    // separately by stateThemes.contrast.test.ts; ignore them in the broad
    // structural scan to keep this test focused on markup issues.
    const structural = accessibilityScanResults.violations.filter(
      (v) => v.id !== "color-contrast"
    );

    expect(
      structural,
      structural.map((v) => `${v.id}: ${v.description}`).join("\n")
    ).toEqual([]);
  });

  test("keyboard tab order reaches the state selector first", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "config");

    // Reset the sequential focus navigation starting point to the very top of
    // the document. Neither `body.click()` nor `body.focus()` does this
    // reliably: the former focuses whatever sits under the click point, and
    // <body> is not focusable, so Firefox ignores the latter and resumes
    // tabbing from wherever the starting point already was — in practice the
    // dismissed tour's position near the end of the DOM, which lands on the
    // fixed-position mascot (focusable index ~119 of 120) instead of the
    // header. Focusing a real sentinel node inserted at the top of <body>
    // moves the starting point in every browser.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      const sentinel = document.createElement("span");
      sentinel.id = "__tab-order-sentinel";
      sentinel.tabIndex = 0;
      document.body.insertBefore(sentinel, document.body.firstChild);
      sentinel.focus();
    });
    // The state combobox is the first interactive control after the header
    // toolbar. The toolbar grows as features are added (undo/redo, theme
    // toggle, presets, compare, scanner, import/export, shortcuts, clear),
    // so allow a generous upper bound rather than hard-coding the current
    // count.
    let reached = false;
    const walked: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.getAttribute("aria-label") ?? el?.id ?? el?.tagName ?? "";
      });
      walked.push(label);
      if (/select state or territory/i.test(label)) {
        reached = true;
        break;
      }
    }

    await page.evaluate(() => document.getElementById("__tab-order-sentinel")?.remove());

    // Surface the walk on failure — "expected true, received false" alone
    // says nothing about where the tab order actually went.
    expect(reached, `tab order never reached the state selector; visited: ${walked.join(" -> ")}`)
      .toBe(true);
  });
});
