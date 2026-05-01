import { test, expect } from "@playwright/test";
import { fillField, selectStateAndVersion, waitForPreview } from "./helpers";

// The validation report must show errors and warnings as visually
// distinct items. We assert that:
//   1. A required-empty form surfaces a `data-severity="error"` row.
//   2. An over-long-validity span surfaces a `data-severity="warning"` row.
//
// The Validation Report section auto-opens when issueCount > 0, so we
// don't click the toggle — that would close it.

async function ensureValidationReportOpen(page: import("@playwright/test").Page) {
  const button = page.getByRole("button", { name: /validation report/i });
  await expect(button).toBeVisible({ timeout: 10_000 });
  if ((await button.getAttribute("aria-expanded")) !== "true") {
    await button.click();
  }
}

test.describe("validation report severity", () => {
  test("a required-empty form surfaces errors", async ({ page }) => {
    await page.goto("/");
    await waitForPreview(page);
    await selectStateAndVersion(page, "CA", "10");
    await ensureValidationReportOpen(page);

    const errorRows = page.locator("[data-severity='error']");
    await expect(errorRows.first()).toBeVisible({ timeout: 10_000 });
  });

  test("a >5-year CA validity span is flagged as a warning", async ({ page }) => {
    await page.goto("/");
    await waitForPreview(page);
    await selectStateAndVersion(page, "CA", "10");

    const fields: Array<[string, string]> = [
      ["DCS", "DOE"],
      ["DAC", "JANE"],
      ["DBD", "01012024"],
      ["DBB", "01011990"],
      ["DBA", "01012030"], // 6 years, exceeds CA 5-year cap
      ["DBC", "2"],
      ["DAY", "BRO"],
      ["DAU", "509"],
      ["DAG", "123 MAIN ST"],
      ["DAI", "ANYTOWN"],
      ["DAK", "90001"],
      ["DAQ", "A1234567"],
      ["DCF", "ABCDEFG12345"],
      ["DCG", "USA"],
      ["DCA", "C"],
      ["DCB", "NONE"],
      ["DCD", "NONE"],
      ["DDE", "N"],
      ["DDF", "N"],
      ["DDG", "N"],
      ["DDB", "01012024"]
    ];
    for (const [code, value] of fields) {
      await fillField(page, code, value);
    }
    await page.keyboard.press("Tab");

    await ensureValidationReportOpen(page);
    const warningRows = page.locator("[data-severity='warning']");
    await expect(warningRows.first()).toBeVisible({ timeout: 10_000 });
  });
});
