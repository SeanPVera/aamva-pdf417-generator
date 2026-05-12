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
 * Switches the active panel on mobile viewports. Does nothing on desktop.
 */
export async function switchMobilePanel(page: Page, panel: "config" | "form" | "preview") {
  const labelMap = { config: "Config", form: "Fields", preview: "Preview" };
  const btn = page.getByRole("button", { name: labelMap[panel], exact: true });
  if (await btn.isVisible()) {
    await btn.click();
  }
}

/**
 * Dismisses the welcome tour if it is present.
 */
export async function ensureTourDismissed(page: Page) {
  try {
    const btn = page.getByRole("button", { name: /skip tour/i });
    // Wait a brief moment for the tour to potentially mount/animate in.
    // If it doesn't appear in 2s, it's likely not going to.
    await btn.waitFor({ state: "visible", timeout: 2000 });
    await btn.click();
  } catch {
    // Ignore if not present or not clickable
  }
}

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await ensureTourDismissed(page);

  await switchMobilePanel(page, "config");
  await page.getByRole("combobox", { name: /select state or territory/i }).selectOption(state);
  await page.getByRole("combobox", { name: /select aamva version/i }).selectOption(version);
}

/**
 * Fills a single AAMVA field. Some fields are rendered as <select>, others
 * as <input> — autodetect via tagName so callers don't have to care.
 */
export async function fillField(
  page: Page,
  code: string,
  value: string,
  skipPanelSwitch = false
) {
  if (!skipPanelSwitch) {
    await switchMobilePanel(page, "form");
  }
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
  // Optimization: switch once before the loop rather than 21 times.
  await switchMobilePanel(page, "form");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value, true);
  }
  await page.keyboard.press("Tab");
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await ensureTourDismissed(page);

  await switchMobilePanel(page, "preview");
  await expect(
    page.getByRole("textbox", { name: /raw aamva payload string/i })
  ).toBeVisible({ timeout: 15_000 });
}
