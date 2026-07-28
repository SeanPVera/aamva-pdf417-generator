import { test, expect } from "@playwright/test";
import { dismissTour } from "./helpers";

test.describe("Actionable Empty State", () => {
  test("displays dynamic feedback for query and filter and allows reset", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    // Search fields for non-existent field to trigger empty state
    const searchInput = page.getByLabel("Search fields");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("NON_EXISTENT_FIELD_xyz");

    // Toggle required fields filter
    const requiredCheckbox = page.getByLabel("Show only required fields");
    await expect(requiredCheckbox).toBeVisible();
    await requiredCheckbox.check();

    // Verify empty state is displayed and role is status (scoped to form container)
    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    // Verify dynamic description has the search query and Required text
    const description = emptyState.locator("p");
    await expect(description).toContainText("NON_EXISTENT_FIELD_xyz");
    await expect(description).toContainText("Required");

    // Click reset button
    const resetButton = emptyState.getByRole("button", { name: "Reset all filters" });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Verify filters are cleared
    await expect(searchInput).toHaveValue("");
    await expect(requiredCheckbox).not.toBeChecked();
    await expect(emptyState).not.toBeVisible();
  });
});
