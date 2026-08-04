import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

test.describe("Actionable Empty State", () => {
  test("searching for a non-existent field displays dynamic empty state and allows resetting filters", async ({
    page
  }) => {
    await page.goto("/");
    await dismissTour(page);

    await ensurePanel(page, "form");

    // Locate search field and enter a non-existent query
    const searchInput = page.locator('input[aria-label="Search fields"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("nonexistent123");

    // Verify the empty state container under `.dmv-main` is visible and has role="status"
    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    // Verify that the empty state heading is shown
    await expect(emptyState.locator("h3")).toHaveText("No matches found");

    // Verify dynamic description contains the smart quoted query term and grammatically correct text
    const description = emptyState.locator("p");
    await expect(description).toContainText("No fields matching");
    await expect(description).toContainText("‘nonexistent123’");

    // Verify "Clear all filters" button is visible
    const clearButton = emptyState.getByRole("button", { name: /Clear all filters/i });
    await expect(clearButton).toBeVisible();

    // Click to clear all filters
    await clearButton.click();

    // Verify search input is cleared and empty state is gone
    await expect(searchInput).toHaveValue("");
    await expect(emptyState).not.toBeVisible();
  });

  test("empty state handles complex filters with requiredOnly active", async ({
    page
  }) => {
    await page.goto("/");
    await dismissTour(page);

    await ensurePanel(page, "form");

    // Toggle requiredOnly checkbox and search for a term that does not match any required fields
    const requiredCheckbox = page.locator('input[aria-label="Show only required fields"]');
    await requiredCheckbox.check();

    const searchInput = page.locator('input[aria-label="Search fields"]');
    await searchInput.fill("nonexistent456");

    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    const description = emptyState.locator("p");
    await expect(description).toContainText("No fields matching");
    await expect(description).toContainText("‘nonexistent456’");
    await expect(description).toContainText("and the Required filter");

    // Clear filters and verify restoration
    const clearButton = emptyState.getByRole("button", { name: /Clear all filters/i });
    await clearButton.click();

    await expect(searchInput).toHaveValue("");
    await expect(requiredCheckbox).not.toBeChecked();
    await expect(emptyState).not.toBeVisible();
  });
});
