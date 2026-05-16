import { test, expect } from "@playwright/test";
import { dismissTour, fillCaliforniaForm, waitForPreview } from "./helpers";

// The critical loop: select state → fill required fields → render barcode →
// confirm the rendered canvas exists and the payload textarea round-trips.
//
// This guards against regressions where bwip-js options change, the canvas
// API drifts, or the form blocks generation for an otherwise-valid record.

test.describe("AAMVA generator end-to-end", () => {
  test("California v10 DL renders a non-empty barcode and exposes its payload", async ({
    page
  }) => {
    await page.goto("/");
    await dismissTour(page);

    // BarcodePreview is React.lazy — wait for the chunk to mount before
    // looking for the canvas, otherwise the default 5s locator timeout can
    // fire while the bwip-js bundle is still downloading.
    await waitForPreview(page);

    // Strict mode is on by default, so the canvas only renders once every
    // required field is satisfied. Fill the CA v10 happy-path values rather
    // than just selecting the state — otherwise the error overlay covers
    // the canvas and toBeVisible() fails by occlusion.
    await fillCaliforniaForm(page);

    // <canvas> with aria-label isn't auto-assigned role=img by Chromium —
    // the accessibility tree exposes it as a generic with the label, so
    // match by attribute rather than role.
    const canvas = page.locator('canvas[aria-label="PDF417 barcode preview"]');
    await expect(canvas).toBeVisible();

    const textarea = page.getByRole("textbox", { name: /raw aamva payload string/i });
    await expect(textarea).not.toHaveValue("", { timeout: 10_000 });

    const payload = await textarea.inputValue();
    expect(payload.startsWith("@")).toBe(true);
    expect(payload).toContain("ANSI ");
    expect(payload).toContain("636014"); // CA IIN
  });
});
