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

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await dismissTour(page);
  await ensurePanel(page, "config");
  await page.getByRole("combobox", { name: /select state or territory/i }).selectOption(state);
  await page.getByRole("combobox", { name: /select aamva version/i }).selectOption(version);
}

/**
 * On mobile viewports, the UI is split into three panels (Config, Fields, Preview).
 * This helper ensures the requested panel is active before interaction.
 */
export async function ensurePanel(page: Page, panel: "config" | "form" | "preview") {
  const isMobile = await page.evaluate(() => window.innerWidth < 1024);
  if (!isMobile) return;

  const labelMap = { config: "Config", form: "Fields", preview: "Preview" };
  const tabButton = page.getByRole("button", { name: labelMap[panel], exact: true });

  // Only click if it's not already active (aria-current is truthy)
  if ((await tabButton.count()) > 0 && (await tabButton.getAttribute("aria-current")) !== "true") {
    await tabButton.click();
    // Give the panel a moment to animate in/render
    await page.waitForTimeout(100);
  }
}

/**
 * The Welcome Tour appears on first load and can obscure elements.
 * Dismiss it early so it doesn't interfere with test interactions.
 */
export async function dismissTour(page: Page) {
  const dialog = page.getByRole("dialog");
  const skipBtn = page.getByRole("button", { name: /skip tour/i });

  try {
    // If it's already there, kill it immediately.
    if (await dialog.isVisible()) {
      await skipBtn.click();
      await expect(dialog).not.toBeVisible();
      return;
    }

    // Otherwise wait up to 2s for it to lazy-load.
    await skipBtn.waitFor({ state: "visible", timeout: 2000 });
    await skipBtn.click();
    await expect(dialog).not.toBeVisible();
  } catch {
    // Tour already dismissed or never showed.
  }
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
  // On mobile, ensure we are on the form panel once before starting the loop
  // to avoid redundant ensurePanel calls inside fillField.
  await ensurePanel(page, "form");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value);
  }
  await page.keyboard.press("Tab");
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await dismissTour(page);
  await ensurePanel(page, "preview");
  await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).toBeVisible({
    timeout: 15_000
  });
}
