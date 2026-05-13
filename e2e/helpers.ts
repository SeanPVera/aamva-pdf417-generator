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

export async function dismissTour(page: Page) {
  // The tour auto-opens on first visit. Dismiss it if present so it doesn't
  // block interactions or focus.
  await page
    .getByRole("button", { name: /skip tour/i })
    .click()
    .catch(() => {
      /* ignore if already dismissed */
    });
}

export async function switchMobilePanel(page: Page, panel: "config" | "form" | "preview") {
  const nav = page.getByRole("navigation", { name: /mobile panel navigation/i });
  if (await nav.isVisible()) {
    await nav.getByRole("button", { name: panel, exact: false }).click();
  }
}

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await dismissTour(page);
  await switchMobilePanel(page, "config");
  await page.getByRole("combobox", { name: /select state or territory/i }).selectOption(state);
  await page.getByRole("combobox", { name: /select aamva version/i }).selectOption(version);
}

/**
 * Fills a single AAMVA field. Some fields are rendered as <select>, others
 * as <input> — autodetect via tagName so callers don't have to care.
 */
export async function fillField(page: Page, code: string, value: string) {
  await switchMobilePanel(page, "form");
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
  await dismissTour(page);
  await selectStateAndVersion(page, "CA", "10");
  await switchMobilePanel(page, "form");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value);
  }
  await page.keyboard.press("Tab");
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await dismissTour(page);
  await switchMobilePanel(page, "preview");
  await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).toBeVisible({
    timeout: 15_000
  });
}
