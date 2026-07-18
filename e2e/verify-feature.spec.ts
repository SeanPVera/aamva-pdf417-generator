import { test, expect } from "@playwright/test";
import { dismissTour } from "./helpers";

test.describe("Actionable Empty State for field filters", () => {
  test("shows dynamic feedback and recovers via reset button", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    // 1. Enter a query that matches no fields
    const searchInput = page.getByLabel("Search fields");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("NONEXISTENTFIELD123");

    // 2. Expect the empty state container to appear with role="status"
    const emptyState = page.locator('div[role="status"]');
    await expect(emptyState).toBeVisible();

    // 3. Confirm it contains the dynamic searchQuery with smart quotes
    await expect(emptyState).toContainText("No fields matching");
    await expect(emptyState).toContainText("‘NONEXISTENTFIELD123’");

    // 4. Click the "Clear all filters" button
    const clearBtn = emptyState.getByRole("button", { name: "Clear all filters" });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // 5. Expect the empty state to be gone and search query cleared
    await expect(emptyState).not.toBeVisible();
    await expect(searchInput).toHaveValue("");
  });

  test("shows correct feedback when both search and required are active", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    // 1. Toggle required-only and search
    const searchInput = page.getByLabel("Search fields");
    const requiredCheckbox = page.getByLabel("Show only required fields");

    await requiredCheckbox.check();
    await searchInput.fill("NONEXISTENTFIELD123");

    const emptyState = page.locator('div[role="status"]');
    await expect(emptyState).toBeVisible();

    // 2. Dynamic description should reference both
    await expect(emptyState).toContainText("‘NONEXISTENTFIELD123’");
    await expect(emptyState).toContainText("and the Required filter");

    // 3. Reset filters
    const clearBtn = emptyState.getByRole("button", { name: "Clear all filters" });
    await clearBtn.click();

    await expect(emptyState).not.toBeVisible();
    await expect(searchInput).toHaveValue("");
    await expect(requiredCheckbox).not.toBeChecked();
  });
});
