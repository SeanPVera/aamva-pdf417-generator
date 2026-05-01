import { test, expect } from "@playwright/test";
import { fillCaliforniaForm, waitForPreview } from "./helpers";

// Smokes the PNG, SVG, and JSON export buttons. We don't validate the
// byte stream — bwip-js is upstream and tested heavily — only that the
// download fires with a sane filename. JSON export is in the header
// (not lazy), so it works without waiting for the BarcodePreview chunk.

test.describe("export buttons", () => {
  test("PNG export triggers a download", async ({ page }) => {
    await page.goto("/");
    await waitForPreview(page);
    await fillCaliforniaForm(page);
    await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).not.toHaveValue(
      "",
      { timeout: 10_000 }
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /export barcode as png/i }).click()
    ]);
    expect(download.suggestedFilename()).toMatch(/^barcode_CA_10\.png$/i);
  });

  test("SVG export triggers a download", async ({ page }) => {
    await page.goto("/");
    await waitForPreview(page);
    await fillCaliforniaForm(page);
    await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).not.toHaveValue(
      "",
      { timeout: 10_000 }
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /export barcode as svg/i }).click()
    ]);
    expect(download.suggestedFilename()).toMatch(/^barcode_CA_10\.svg$/i);
  });

  test("JSON export triggers a download with the right filename", async ({ page }) => {
    await page.goto("/");
    await fillCaliforniaForm(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /export current fields as json/i }).click()
    ]);
    expect(download.suggestedFilename()).toMatch(/^aamva_CA_10\.json$/i);
  });
});
