import { test, expect } from "@playwright/test";
import {
  dismissTour,
  ensurePanel,
  fillCaliforniaForm,
  openSection,
  revealField,
  waitForPreview
} from "./helpers";

// Covers the form affordances that only exist in the browser: live casing, the
// date normaliser, quick fixes, clipboard import, the step rail, the mobile
// status bar, and the road test. The pure logic behind each of these is
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
    // It lives in Address, so the rail has to move before it is on the page.
    await revealField(page, "DAJ");
    await expect(page.locator("#DAJ")).toHaveValue("CA");
    await expect(page.locator("#DAJ")).toHaveAttribute("readonly", "");
  });

  test("a date chip fills the issue date", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await revealField(page, "DBD");
    await page.getByRole("button", { name: /^Set DBD:/ }).click();
    await expect(page.locator("#DBD")).toHaveValue(/^\d{8}$/);
  });

  test("a quick fix rewrites a height into the encoded form", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await revealField(page, "DAU");
    await page.locator("#DAU").fill("5-9");
    await page.getByRole("button", { name: /Rewrite the height as .* for DAU/i }).click();
    await expect(page.locator("#DAU")).toHaveValue("069 IN");
  });

  test("pasting a JSON profile loads the form", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");
    await expect(page.locator("#DCS")).toHaveValue("");

    // Firefox ignores `clipboardData` passed to the ClipboardEvent constructor,
    // so the property is defined on a plain Event instead — which is also
    // exactly the contract the handler reads (`e.clipboardData.getData`).
    await page.evaluate(
      (payload) => {
        const event = new Event("paste", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "clipboardData", {
          value: { getData: () => payload }
        });
        document.body.dispatchEvent(event);
      },
      JSON.stringify({ state: "CA", version: "10", DCS: "DOE", DAC: "JANE" })
    );

    await expect(page.locator("#DCS")).toHaveValue("DOE", { timeout: 5000 });
    await expect(page.locator("#DAC")).toHaveValue("JANE");
  });

  // Replaces the old "group navigator jumps to a group" spec: GroupNav scrolled
  // within one long form, so a jump could only ever fail to scroll. The rail
  // paginates instead, which is a stronger claim — the section you left has to
  // actually leave the DOM, or the redesign bought nothing.
  test("the step rail paginates the form", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    // Identity opens first, and Privileges is nowhere on the page.
    await expect(page.locator("#DCS")).toBeVisible();
    await expect(page.locator("#DCA")).toHaveCount(0);

    await openSection(page, "Driving Privileges");

    await expect(page.locator("#DCA")).toBeVisible();
    await expect(page.locator("#DCS")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Driving Privileges" })).toBeVisible();
  });

  test("a search reaches every section at once", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    // Filtering is the escape hatch from pagination: matches from every rung,
    // so the power-user path the section IA costs is bought back here.
    await page.getByLabel(/search fields/i).fill("date");
    await expect(page.locator("#DBB")).toBeVisible(); // Identity
    await expect(page.locator("#DBD")).toBeVisible(); // License Details
  });

  test("the mobile bar reports status without leaving the form", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");
    await dismissTour(page);
    await ensurePanel(page, "form");

    const bar = page.getByRole("region", { name: /kiosk navigation/i });
    await expect(bar).toBeVisible();
    // An empty form is blocked on required fields, so the bar offers the jump
    // rather than an export. "Next" while everything is merely blank, "Fix"
    // once something is actually wrong — a blank field is not an error.
    await expect(bar.getByRole("button", { name: /^(next|fix)$/i })).toBeVisible();

    // Once the form is complete the bar offers the export instead, under a name
    // of its own — two controls answering to one accessible name is ambiguous
    // for anyone navigating by name.
    await fillCaliforniaForm(page);
    await ensurePanel(page, "form");
    await expect(bar.getByRole("button", { name: "Quick export barcode as PNG" })).toBeVisible({
      timeout: 10_000
    });
    await expect(page.getByRole("button", { name: "Export barcode as PNG" })).toHaveCount(1);
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
