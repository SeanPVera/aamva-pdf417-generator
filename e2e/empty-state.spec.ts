import { test, expect } from "@playwright/test";
import { dismissTour } from "./helpers";

test.describe("Actionable Empty State", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
  });

  test("shows actionable empty state when no fields match filters", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search fields/i);

    // Type something that won't match any field code or label
    await searchInput.fill("NON_EXISTENT_FIELD_XYZ");

    // Assert empty state is visible
    await expect(page.getByText(/no fields match your filters/i)).toBeVisible();
    await expect(page.getByText(/try adjusting your search/i)).toBeVisible();

    const clearButton = page.getByRole("button", { name: /clear all filters/i });
    await expect(clearButton).toBeVisible();

    // Click clear button
    await clearButton.click();

    // Assert filters are reset
    await expect(searchInput).toHaveValue("");
    await expect(page.getByText(/no fields match your filters/i)).not.toBeVisible();

    // Check that some fields are visible again (e.g., First Name or DCS)
    await expect(page.getByText(/DCS — Customer Family Name/)).toBeVisible();
  });

  test("clear all filters also resets 'Required only' toggle", async ({ page }) => {
    // Enable 'Required only' filter
    const requiredToggle = page.getByLabel(/show only required fields/i);
    await requiredToggle.check();

    // Type something that doesn't match
    const searchInput = page.getByPlaceholder(/search fields/i);
    await searchInput.fill("XZY_NONE");

    await expect(page.getByText(/no fields match your filters/i)).toBeVisible();

    // Click clear
    await page.getByRole("button", { name: /clear all filters/i }).click();

    // Assert both are reset
    await expect(searchInput).toHaveValue("");
    await expect(requiredToggle).not.toBeChecked();
  });
});
