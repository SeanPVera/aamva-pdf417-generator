import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

test.describe("Actionable Empty State", () => {
  test("shows dynamic feedback with smart quotes and allows clearing filters", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    const searchInput = page.getByLabel("Search fields");
    await expect(searchInput).toBeVisible();

    // Type a search query that matches no fields
    await searchInput.fill("xyz999");

    // The container with role="status" should be visible inside the main area
    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    // Expect the status message to dynamically show the query in smart quotes
    await expect(emptyState).toContainText("No fields matching \u2018xyz999\u2019.");

    // Click "Clear all filters" to reset the state
    const clearBtn = emptyState.getByRole("button", { name: /clear all filters/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // The search input should be empty now
    await expect(searchInput).toHaveValue("");

    // The empty state should be gone
    await expect(emptyState).not.toBeVisible();
  });

  test("handles combined filters correctly", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    const searchInput = page.getByLabel("Search fields");
    const requiredCheckbox = page.getByLabel("Show only required fields");

    // Enable "Required only" filter
    await requiredCheckbox.check();

    // Type a query that matches no fields
    await searchInput.fill("xyz999");

    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    // Expect the combined description
    await expect(emptyState).toContainText("No fields matching \u2018xyz999\u2019 and the Required filter.");

    // Clear search query, keep required filter active
    await searchInput.fill("");

    // If query is empty but required only is checked, we should still see fields.
    // Let's type another non-matching term to keep it empty
    await searchInput.fill("abc777");
    await expect(emptyState).toContainText("No fields matching \u2018abc777\u2019 and the Required filter.");

    // Let's clear search query and we should see required fields (so empty state should be gone)
    await searchInput.fill("");
    await expect(emptyState).not.toBeVisible();
  });
});
