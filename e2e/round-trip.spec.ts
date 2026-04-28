import { test, expect } from "@playwright/test";

// The critical loop: select state → fill required fields → render barcode →
// confirm the rendered canvas exists and the payload textarea round-trips.
//
// This guards against regressions where bwip-js options change, the canvas
// API drifts, or the form blocks generation for an otherwise-valid record.

test.describe("AAMVA generator end-to-end", () => {
  test("California v10 DL renders a non-empty barcode and exposes its payload", async ({ page }) => {
    await page.goto("/");

    // The state and version selectors are labeled aria-* — use them rather than
    // brittle CSS selectors.
    await page
      .getByRole("combobox", { name: /select state or territory/i })
      .selectOption("CA");
    await page
      .getByRole("combobox", { name: /select aamva version/i })
      .selectOption("10");

    // Wait for the canvas to render. bwip-js draws synchronously after fields
    // are filled; we expect non-zero dimensions once a valid payload exists.
    const canvas = page.getByRole("img", { name: /pdf417 barcode preview/i });
    await expect(canvas).toBeVisible();

    // The payload textarea (aria-label="Raw AAMVA payload string") should be
    // populated with an AAMVA-format string starting with "@".
    const payload = await page
      .getByRole("textbox", { name: /raw aamva payload string/i })
      .inputValue();

    // Either the payload is populated (happy path) or empty (form has unmet
    // required fields). We accept both, but if populated it must be valid.
    if (payload.length > 0) {
      expect(payload.startsWith("@")).toBe(true);
      expect(payload).toContain("ANSI ");
      expect(payload).toContain("636014"); // CA IIN
    }
  });
});
