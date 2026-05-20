import { expect, type Page } from "@playwright/test";

// Required-field minimum for a CA v10 DL — values chosen to satisfy every
// rule pack constraint (DAQ regex, validity span, age at issue) AND to
// avoid strict-mode-blocking advisories (DDB ≥ DBD).
export const CA_REQUIRED_FIELDS: Array<[string, string]> = [
  ["DCS", "DOE"],
  ["DAC", "JANE"],
  ["DBD", "01012024"],
  ["DBB", "01011990"],
  ["DBA", "01012028"],
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

/**
 * Dismisses the welcome tour if it is visible.
 */
export async function dismissTour(page: Page) {
  const skipBtn = page.getByRole("button", { name: /skip tour/i });
  try {
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
      // Wait for the dialog to actually be removed from the DOM
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  } catch {
    // If the check fails or timeout occurs, we assume the tour isn't there or is already gone
  }
}

/**
 * Ensures the specified panel is visible on mobile viewports.
 * On desktop, all panels are typically visible so this is a no-op.
 */
export async function ensurePanel(page: Page, panel: "config" | "form" | "preview") {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    const labels = { config: "Config", form: "Fields", preview: "Preview" };
    const tab = page.getByRole("button", { name: labels[panel], exact: true });
    // Check if the tab is already active to avoid redundant clicks
    const isActive = (await tab.getAttribute("aria-current")) === "true";
    if (!isActive) {
      await tab.click();
      // Ensure the panel transition has finished by checking aria-current
      await expect(tab).toHaveAttribute("aria-current", "true");
    }
  }
}

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await dismissTour(page);
  await ensurePanel(page, "config");
  await page.getByRole("combobox", { name: /select state or territory/i }).selectOption(state);
  await page.getByRole("combobox", { name: /select aamva version/i }).selectOption(version);
}

/**
 * Fills a single AAMVA field. Some fields are rendered as <select>, others
 * as <input> — autodetect via tagName so callers don't have to care.
 */
export async function fillField(page: Page, code: string, value: string) {
  await ensurePanel(page, "form");
  const locator = page.locator(`#${code}`);
  await locator.waitFor({ state: "attached" });
  const tagName = await locator.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === "select") {
    await locator.selectOption(value);
  } else {
    await locator.fill(value);
  }
}

export async function fillCaliforniaForm(page: Page) {
  await selectStateAndVersion(page, "CA", "10");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value);
  }
  await page.keyboard.press("Tab");
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await ensurePanel(page, "preview");
  await expect(
    page.getByRole("textbox", { name: /raw aamva payload string/i })
  ).toBeVisible({ timeout: 15_000 });
}
