import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel, fillCaliforniaForm, waitForPreview } from "./helpers";

// Drives the form through a complete CA-v10 fill-out and asserts the
// resulting payload (a) renders into the payload textarea and (b) starts
// with the right AAMVA header bytes for the chosen jurisdiction. This is
// the "happy path" the entire generator pipeline must always satisfy.

test.describe("CA v10 happy-path form fill", () => {
  test("filling all required fields produces a non-empty AAMVA payload", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await waitForPreview(page);
    await fillCaliforniaForm(page);
    await ensurePanel(page, "preview");

    const textarea = page.getByRole("textbox", { name: /raw aamva payload string/i });
    await expect(textarea).not.toHaveValue("", { timeout: 10_000 });

    const payload = await textarea.inputValue();
    expect(payload.startsWith("@")).toBe(true);
    expect(payload).toContain("ANSI ");
    // CA IIN; sanity check that the right jurisdiction was used.
    expect(payload).toContain("636014");
    // The license number we typed survives encoding.
    expect(payload).toContain("DAQA1234567");
    // The family name we typed round-trips through the AAMVA wire format.
    expect(payload).toContain("DCSDOE");
  });

  test("displays an actionable empty state when filters find no fields", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await waitForPreview(page);
    await ensurePanel(page, "form");

    // Search for a non-existent field
    const searchInput = page.getByLabel("Search fields");
    await searchInput.fill("NONEXISTENT_FIELD_QUERY");

    // The empty state container should be visible and have role="status"
    const emptyState = page.locator('.dmv-main div[role="status"]');
    await expect(emptyState).toBeVisible();

    // Check that it contains the search query and the clear button
    await expect(emptyState).toContainText("nonexistent_field_query");

    // Click the clear all filters button
    const clearButton = emptyState.getByRole("button", { name: "Clear all filters" });
    await clearButton.click();

    // The search input should be empty now
    await expect(searchInput).toHaveValue("");

    // The empty state should be gone
    await expect(emptyState).not.toBeVisible();
  });
});
