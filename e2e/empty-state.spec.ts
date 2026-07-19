import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

test.describe("Actionable Empty State", () => {
  test("should display empty state when filter matches nothing and should clear filters when CTA is clicked", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    // Search for a non-existent field to trigger empty state
    const searchInput = page.getByLabel("Search fields");
    await searchInput.fill("nonexistentquery123");

    // Verify empty state container with specific heading or aria-live status is visible
    const emptyState = page.locator('div[role="status"]').filter({ hasText: "No fields found" });
    await expect(emptyState).toBeVisible();

    // Verify smart quotes wrapped search query
    const emptyText = await emptyState.locator("p").textContent();
    expect(emptyText).toContain("nonexistentquery123");

    // Click the clear all filters button
    const clearBtn = emptyState.getByRole("button", { name: /clear all filters/i });
    await clearBtn.click();

    // Verify the empty state is hidden and fields are shown
    await expect(emptyState).not.toBeVisible();
    await expect(searchInput).toHaveValue("");
  });
});
