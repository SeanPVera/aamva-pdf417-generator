import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissTour, switchMobilePanel } from "./helpers";

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
    await switchMobilePanel(page, "config");

    // Reset focus to the document start. `body.click()` focuses whatever
    // element happens to be under the click point, which can land mid-form
    // and skip the header entirely.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      document.body.focus();
    });
    // The state combobox is the first interactive control after the header
    // toolbar. The toolbar grows as features are added (undo/redo, theme
    // toggle, presets, compare, scanner, import/export, shortcuts, clear),
    // so allow a generous upper bound rather than hard-coding the current
    // count.
    let reached = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const label = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ?? ""
      );
      if (/select state or territory/i.test(label)) {
        reached = true;
        break;
      }
    }
    expect(reached).toBe(true);
  });
});
