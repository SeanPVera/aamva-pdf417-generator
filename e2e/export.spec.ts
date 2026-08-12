import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel, fillCaliforniaForm, waitForPreview } from "./helpers";

// Smokes the PNG, SVG, and JSON export buttons. We don't validate the
// byte stream — bwip-js is upstream and tested heavily — only that the
// download fires with a sane filename. JSON export is in the header
// (not lazy), so it works without waiting for the BarcodePreview chunk.
//
// Filenames come from `buildExportBasename`. By default they carry NO personal
// data — `barcode_CA_DL_V10_<dd>.png` — because a download filename is the one
// place a field value would escape the tab. The cardholder's name is added only
// when the user ticks the opt-in beside the export buttons.

test.describe("export buttons", () => {
  test("PNG export triggers a download", async ({ page }) => {
    await page.goto("/");
    await waitForPreview(page);
    await fillCaliforniaForm(page);
    await ensurePanel(page, "preview");
    await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).not.toHaveValue(
      "",
      { timeout: 10_000 }
    );

    // Scoped to the preview panel: at mobile widths the sticky status bar also
    // offers a PNG export, so an unscoped name matches two real controls.
    const preview = page.getByRole("complementary", { name: /barcode preview/i });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      preview.getByRole("button", { name: /export barcode as png/i }).click()
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/^barcode_CA_DL_V10(_[A-Z0-9]+)?\.png$/i);
    expect(name).not.toMatch(/DOE|JANE/i);
  });

  test("SVG export triggers a download", async ({ page }) => {
    await page.goto("/");
    await waitForPreview(page);
    await fillCaliforniaForm(page);
    await ensurePanel(page, "preview");
    await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).not.toHaveValue(
      "",
      { timeout: 10_000 }
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /export barcode as svg/i }).click()
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/^barcode_CA_DL_V10(_[A-Z0-9]+)?\.svg$/i);
    expect(name).not.toMatch(/DOE|JANE/i);
  });

  test("JSON export triggers a download with the right filename", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await fillCaliforniaForm(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /export current fields as json/i }).click()
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/^aamva_CA_DL_V10(_[A-Z0-9]+)?\.json$/i);
    expect(name).not.toMatch(/DOE|JANE/i);
  });
});
