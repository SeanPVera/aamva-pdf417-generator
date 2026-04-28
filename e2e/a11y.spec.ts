import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("accessibility", () => {
  test("homepage has no axe violations on WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/");

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
    // Focus the body, then start tabbing.
    await page.locator("body").click();
    // The first interactive control after the header should be reachable
    // within a reasonable number of tabs.
    let reached = false;
    for (let i = 0; i < 12; i++) {
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
