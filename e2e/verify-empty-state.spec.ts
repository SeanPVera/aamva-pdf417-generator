import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

test.describe("Actionable Empty State", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
  });

  test("shows actionable empty state when no fields match search", async ({ page }) => {
    await ensurePanel(page, "form");

    // Search for a non-existent field
    const searchInput = page.getByLabel("Search fields");
    await searchInput.fill("NONEXISTENT_FIELD");

    // Verify empty state is visible
    await expect(page.getByText("No matching fields")).toBeVisible();
    await expect(page.getByText(/No fields found matching/)).toBeVisible();
    await expect(page.getByText("NONEXISTENT_FIELD")).toBeVisible();

    // Verify "Clear all filters" button works
    const clearButton = page.getByRole("button", { name: "Clear all filters" });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify filters are cleared and fields are visible again
    await expect(searchInput).toHaveValue("");
    await expect(page.getByText("No matching fields")).not.toBeVisible();
    // Check for some common field label that should be visible
    await expect(page.getByLabel(/Customer Family Name/i)).toBeVisible();
  });

  test("shows actionable empty state with complex filters", async ({ page }) => {
    await ensurePanel(page, "form");

    // Enable "Required only"
    const requiredCheckbox = page.getByLabel("Show only required fields");
    await requiredCheckbox.check();

    // Search for a field that is NOT required (e.g., DAC in v10 CA is required, but let's find something likely not required or just search nonsensical)
    const searchInput = page.getByLabel("Search fields");
    await searchInput.fill("ZXZX"); // Highly unlikely to match anything

    // Verify complex message
    await expect(page.getByText("No matching fields")).toBeVisible();
    await expect(page.getByText(/No fields found matching/)).toBeVisible();
    await expect(page.getByText("ZXZX")).toBeVisible();
    await expect(page.getByText("and the Required filter")).toBeVisible();

    // Clear all filters
    await page.getByRole("button", { name: "Clear all filters" }).click();

    // Verify all filters cleared
    await expect(searchInput).toHaveValue("");
    await expect(requiredCheckbox).not.toBeChecked();
  });
});
