import { test, expect } from "@playwright/test";
import { dismissTour, selectState } from "./helpers";

// Issuer choice changes the record, never the contrast or meaning of UI colors.
for (const state of ["CA", "NY", "TX", "FL", "WA", "DC"]) {
  test(`workbench appearance stays stable when selecting ${state}`, async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    const paint = () =>
      page.locator(".workbench-header").evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color
      }));
    const before = await paint();
    await selectState(page, state);
    await expect(page.getByRole("combobox", { name: /select state or territory/i })).toHaveValue(
      new RegExp(`\\(${state}\\)`)
    );
    expect(await paint()).toEqual(before);
  });
}
