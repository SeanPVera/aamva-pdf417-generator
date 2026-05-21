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
 * Dismisses the welcome tour if it's visible.
 * This is necessary because the tour modal can obscure elements and block interactions,
 * especially in CI environments where it might appear unexpectedly.
 */
export async function dismissTour(page: Page) {
  try {
    const skipButton = page.getByRole("button", { name: /skip tour/i });
    await skipButton.waitFor({ state: "visible", timeout: 3000 });
    await skipButton.click();
    await expect(page.getByRole("dialog", { name: /welcome to/i })).not.toBeVisible();
  } catch (e) {
    // Continue if tour doesn't appear
  }
}

/**
 * Switches between 'config' and 'preview' panels on mobile viewports.
 * On desktop (>= 1024px), both panels are visible side-by-side.
 */
export async function ensurePanel(page: Page, panel: "config" | "preview") {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    const tab = page.getByRole("tab", { name: new RegExp(panel, "i") });
    if ((await tab.getAttribute("aria-current")) !== "page") {
      await tab.click();
      await expect(tab).toHaveAttribute("aria-current", "page");
    }
  }
}

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await ensurePanel(page, "config");
  await page.getByRole("combobox", { name: /select state or territory/i }).selectOption(state);
  await page.getByRole("combobox", { name: /select aamva version/i }).selectOption(version);
}

/**
 * Fills a single AAMVA field. Some fields are rendered as <select>, others
 * as <input> — autodetect via tagName so callers don't have to care.
 */
export async function fillField(page: Page, code: string, value: string) {
  await ensurePanel(page, "config");
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
  // If on mobile, we might need to switch to preview panel to see it,
  // but usually we wait for it to be visible in the DOM/accessible first.
  await expect(
    page.getByRole("textbox", { name: /raw aamva payload string/i })
  ).toBeVisible({ timeout: 15_000 });
}
