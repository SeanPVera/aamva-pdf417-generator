import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

// When the field filters match nothing the panel must not be a dead end: it
// announces itself to assistive tech and offers a one-click way back.
test.describe("field filter empty state", () => {
  test("a search matching no field offers a working reset", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    const search = page.getByLabel(/search fields/i);
    await search.fill("ZZZ_NO_SUCH_FIELD");

    const emptyState = page.getByRole("status").filter({ hasText: "No fields found" });
    await expect(emptyState).toBeVisible();
    // The message names the filter that caused the dead end.
    await expect(emptyState).toContainText("ZZZ_NO_SUCH_FIELD");

    await emptyState.getByRole("button", { name: /reset all filters/i }).click();

    await expect(search).toHaveValue("");
    await expect(emptyState).not.toBeVisible();
  });
});
