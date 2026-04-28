import { test, expect } from "@playwright/test";

// Visual regression for representative state themes. Themes are applied via
// CSS custom properties on <html>; a snapshot of the header strip captures
// the entire palette rendering in one image per state.
//
// On first run, baselines are written to e2e/__screenshots__/.  Update with:
//   npx playwright test --update-snapshots

const REPRESENTATIVE_STATES = ["CA", "NY", "TX", "FL", "WA", "DC"];

for (const state of REPRESENTATIVE_STATES) {
  test(`state theme snapshot: ${state}`, async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("combobox", { name: /select state or territory/i })
      .selectOption(state);

    // Settle: wait for the next paint after CSS variables update.
    await page.waitForTimeout(300);

    // Snapshot the chrome strip — header + sidebar surface — to capture
    // primary, accent, and tint together in one image.
    const chrome = page.locator("body");
    await expect(chrome).toHaveScreenshot(`theme-${state}.png`, {
      maxDiffPixelRatio: 0.01,
      // Mask any dynamic content that would cause flakiness.
      mask: [page.getByRole("textbox", { name: /raw aamva payload string/i })]
    });
  });
}
