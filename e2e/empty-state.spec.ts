import { test, expect } from "@playwright/test";
import { dismissTour } from "./helpers";

test.describe("Actionable Empty State", () => {
  test("searching for a non-existent field displays actionable empty state", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    const searchInput = page.getByLabel("Search fields");
    await expect(searchInput).toBeVisible();

    // Type a non-existent field value
    await searchInput.fill("xyz123nonexistent");

    // Scope role="status" specifically to .dmv-main to avoid multiple status areas strict mode violation
    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    // Verify it dynamically displays the search query
    await expect(emptyState).toContainText("xyz123nonexistent");

    // Click on "Clear filters" button
    const clearBtn = emptyState.getByRole("button", { name: /clear filters/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Verify input is cleared
    await expect(searchInput).toHaveValue("");
    await expect(emptyState).not.toBeVisible();
  });
});
