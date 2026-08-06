import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

test.describe("Actionable Empty State", () => {
  test("searching for non-existent field displays dynamic empty state with reset button", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    // Locators for the search and checkbox inputs
    const searchInput = page.getByLabel("Search fields");
    const requiredCheckbox = page.getByLabel("Show only required fields");

    // Search for a non-existent field
    await searchInput.fill("NON_EXISTENT_FIELD_XYZ");

    // Verify empty state container has role="status" and is visible
    const emptyState = page.locator(".dmv-main div[role='status']");
    await expect(emptyState).toBeVisible();

    // Verify dynamic text includes the query inside smart quotes
    await expect(emptyState).toContainText("‘NON_EXISTENT_FIELD_XYZ’");

    // Enable Required Only filter as well
    await requiredCheckbox.check();

    // Verify dynamic text updates to reflect both active filters
    await expect(emptyState).toContainText("and the Required filter");

    // Click the actionable reset button
    const resetButton = emptyState.getByRole("button", { name: "Reset all filters" });
    await resetButton.click();

    // Verify filters are cleared
    await expect(searchInput).toHaveValue("");
    await expect(requiredCheckbox).not.toBeChecked();

    // Verify empty state is gone and fields are displayed again
    await expect(emptyState).not.toBeVisible();
  });
});
