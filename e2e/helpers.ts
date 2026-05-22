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

/** Switches the mobile panel if on a small screen. */
export async function ensurePanel(page: Page, panel: "config" | "form" | "preview") {
  // Use evaluate to get the actual client width, which is more reliable for
  // the CSS media query breakpoints (lg: 1024px).
  const width = await page.evaluate(() => window.innerWidth);
  const isMobile = width < 1024;
  if (!isMobile) return;

  // The tour can obscure the panel tabs; ensure it's gone.
  await dismissTour(page);

  const labels = {
    config: "Config",
    form: "Fields",
    preview: "Preview"
  };

  const tab = page.getByRole("button", { name: labels[panel], exact: true });
  // If we aren't already on this panel, click the tab.
  if ((await tab.getAttribute("aria-current")) !== "true") {
    await tab.click();
    // Wait for the transition to finish so elements are interactable.
    await expect(tab).toHaveAttribute("aria-current", "true", { timeout: 5000 });
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
 * Note: Caller should ensure the "Fields" panel is active on mobile.
 */
export async function fillField(page: Page, code: string, value: string) {
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
  await ensurePanel(page, "form");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value);
  }
  await page.keyboard.press("Tab");
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await ensurePanel(page, "preview");
  // Wait for the heading which is always visible in the preview aside
  await expect(page.getByRole("heading", { name: /preview/i })).toBeVisible({ timeout: 15_000 });
}

/** Dismisses the Welcome Tour if it's visible. */
export async function dismissTour(page: Page) {
  const skipBtn = page.getByRole("button", { name: /skip tour/i });
  try {
    // Wait up to 3s for the tour skip button to be visible.
    // In CI, mounting can sometimes be delayed.
    await skipBtn.waitFor({ state: "visible", timeout: 3000 });
    await skipBtn.click();
    // Confirm it's gone so it doesn't obscure future clicks.
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } catch {
    // If it doesn't show up within 3s, assume it's already dismissed or not showing.
  }
}
