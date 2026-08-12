import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel, fillCaliforniaForm, waitForPreview } from "./helpers";

// Covers the form affordances that only exist in the browser: live casing, the
// date normaliser, quick fixes, clipboard import, the group navigator, the
// mobile status bar, and the road test. The pure logic behind each of these is
// unit tested in src/tests — these assert the wiring.
test.describe("form affordances", () => {
  test("uppercases typing, normalizes a slashed date, and fills DAJ", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    // String fields are upper-cased live, because that is what the encoder
    // writes — showing lower case would be showing something untrue.
    await page.locator("#DCS").fill("doe");
    await expect(page.locator("#DCS")).toHaveValue("DOE");

    // Dates fold to the wire format on blur, not mid-keystroke.
    await page.locator("#DBB").fill("8/11/1990");
    await page.locator("#DCS").focus();
    await expect(page.locator("#DBB")).toHaveValue("08111990");

    // DAJ is filled from the jurisdiction and not editable: the generator
    // overrides it anyway, so it was a required field nobody could satisfy.
    await expect(page.locator("#DAJ")).toHaveValue("CA");
    await expect(page.locator("#DAJ")).toHaveAttribute("readonly", "");
  });

  test("a date chip fills the issue date", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");
    await page.getByRole("button", { name: /^Set DBD:/ }).click();
    await expect(page.locator("#DBD")).toHaveValue(/^\d{8}$/);
  });

  test("a quick fix rewrites a height into the encoded form", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");
    await page.locator("#DAU").fill("5-9");
    await page.getByRole("button", { name: /Rewrite the height as .* for DAU/i }).click();
    await expect(page.locator("#DAU")).toHaveValue("069 IN");
  });

  test("pasting a JSON profile loads the form", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");
    await expect(page.locator("#DCS")).toHaveValue("");

    await page.evaluate(() => {
      const data = new DataTransfer();
      data.setData(
        "text",
        JSON.stringify({ state: "CA", version: "10", DCS: "DOE", DAC: "JANE" })
      );
      const event = new ClipboardEvent("paste", { bubbles: true });
      Object.defineProperty(event, "clipboardData", {
        value: data,
        writable: false,
        configurable: true
      });
      document.body.dispatchEvent(event);
    });

    await expect(page.locator("#DCS")).toHaveValue("DOE", { timeout: 5000 });
    await expect(page.locator("#DAC")).toHaveValue("JANE");
  });

  test("the group navigator jumps to a group", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");
    await page.getByRole("button", { name: /Jump to Driving Privileges/i }).click();
    await expect(page.locator("#field-group-privileges-heading")).toBeVisible();
  });

  test("the mobile bar reports status without leaving the form", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    const bar = page.getByRole("region", { name: /barcode status/i });
    await expect(bar).toBeVisible();
    // An empty form is blocked on required fields, so the bar offers the jump
    // rather than an export.
    await expect(bar.getByRole("button", { name: /next field|fix next/i })).toBeVisible();
  });

  test("PDF export triggers a download", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await waitForPreview(page);
    await fillCaliforniaForm(page);
    await waitForPreview(page);
    await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).not.toHaveValue(
      "",
      { timeout: 10_000 }
    );

    const download = page.waitForEvent("download", { timeout: 20_000 });
    await page.getByRole("button", { name: /export barcode as pdf/i }).click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  });
});

// Entirely decorative, and still held to the same standard as everything else:
// it has to open, run, and produce a score sheet.
test.describe("road test", () => {
  test("opens, runs, and grades an attempt", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await page.getByRole("button", { name: /toggle playful extras/i }).click();
    await page.getByRole("menuitem", { name: /take the road test/i }).click();

    const dialog = page.getByRole("dialog", { name: /behind-the-wheel/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /begin examination/i }).click();

    // Drive briefly, then hand in the attempt.
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(400);
    await page.keyboard.up("ArrowUp");
    await dialog.getByRole("button", { name: /i'm parked/i }).click();

    await expect(dialog.getByText(/examiner's score sheet/i)).toBeVisible();
    // Nowhere near the space, so the examiner has an opinion about it.
    await expect(dialog.getByText(/not within the designated space/i)).toBeVisible();
  });
});
