import { Page, expect } from "@playwright/test";

/**
 * Dismisses the welcome tour if it's visible.
 * This is necessary because the tour modal can obscure elements and block interactions,
 * especially in CI environments where it might appear unexpectedly.
 */
export async function dismissTour(page: Page) {
  try {
    // Wait for the skip button to appear with a short timeout.
    // We use a small timeout because the tour either shows up almost immediately or not at all.
    const skipButton = page.getByRole("button", { name: /skip tour/i });
    await skipButton.waitFor({ state: "visible", timeout: 3000 });
    await skipButton.click();
    // Verify it's actually gone
    await expect(page.getByRole("dialog", { name: /welcome to/i })).not.toBeVisible();
  } catch (e) {
    // If the tour doesn't appear or is already dismissed, we continue silently
  }
}

export async function waitForPreview(page: Page) {
  // Wait for the preview panel to be visible (it's lazy loaded)
  await expect(page.getByText(/fill the required fields to see the barcode/i).or(
    page.locator('canvas[aria-label="PDF417 barcode preview"]')
  )).toBeVisible({ timeout: 10000 });
}

export async function fillCaliforniaForm(page: Page) {
  // Select California if not already selected
  const stateSelect = page.getByLabel(/state \/ territory/i);
  await stateSelect.selectOption("CA");

  // Ensure we are on the Config panel on mobile
  await ensurePanel(page, "config");

  // Fill mandatory fields for CA v10
  await page.getByLabel("DCS — Customer Family Name").fill("DOE");
  await page.getByLabel("DAC — Customer First Name").fill("JOHN");
  await page.getByLabel("DBB — Date of Birth").fill("01011990");
  await page.getByLabel("DBC — Sex").fill("1");
  await page.getByLabel("DDE — Family Name Truncation").fill("N");
  await page.getByLabel("DDF — First Name Truncation").fill("N");
  await page.getByLabel("DDG — Middle Name Truncation").fill("N");

  await page.getByLabel("DAG — Address Street").fill("123 MAIN ST");
  await page.getByLabel("DAI — City").fill("SACRAMENTO");
  await page.getByLabel("DAJ — Jurisdiction Code").fill("CA");
  await page.getByLabel("DAK — Postal Code").fill("95814");

  await page.getByLabel("DAQ — Customer ID Number").fill("F1234567");
  await page.getByLabel("DAR — License Class").fill("C");
  await page.getByLabel("DAS — Restriction Code").fill("NONE");
  await page.getByLabel("DAT — Endorsement Code").fill("NONE");
  await page.getByLabel("DBD — Document Issue Date").fill("01012020");
  await page.getByLabel("DBA — Document Expiration Date").fill("01012030");
  await page.getByLabel("DCF — Document Discriminator").fill("12345678901234567890");
  await page.getByLabel("DCG — Country Identification").fill("USA");

  // CA specific version 10 fields
  await page.getByLabel("DAY — Eye Color").fill("BRO");
  await page.getByLabel("DAU — Height").fill("070 IN");
}

export async function ensurePanel(page: Page, panel: "config" | "preview") {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    const tab = page.getByRole("tab", { name: new RegExp(panel, "i") });
    if (await tab.getAttribute("aria-current") !== "page") {
      await tab.click();
      // Wait for panel transition
      await expect(tab).toHaveAttribute("aria-current", "page");
    }
  }
}
