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
 * Switches to a specific panel on mobile viewports.
 */
export async function ensurePanel(page: Page, panel: "config" | "form" | "preview") {
  const isMobile = page.viewportSize()?.width ? page.viewportSize()!.width < 1024 : false;
  if (!isMobile) return;

  const tabName = panel === "form" ? "fields" : panel;
  const tab = page.getByRole("button", { name: new RegExp(`^${tabName}$`, "i") });

  // On mobile, these tabs should be visible. Wait for them to ensure the UI is ready.
  await expect(tab).toBeVisible({ timeout: 5000 });
  if ((await tab.getAttribute("aria-current")) !== "true") {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-current", "true");
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
  await ensurePanel(page, "form");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value);
  }
  await page.keyboard.press("Tab");
}

/**
 * Dismisses the welcome tour if it appears.
 */
export async function dismissTour(page: Page) {
  const tourDialog = page.getByRole("dialog", { name: /pick a state and version/i });
  const skipBtn = page.getByRole("button", { name: /skip tour/i });

  // The tour might take a moment to pop up as the app initializes.
  // We use a short timeout and try/catch to handle both cases gracefully.
  try {
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
      // Ensure the tour is actually gone before returning.
      // This is crucial for tests that expect focus to be restored.
      await expect(tourDialog).not.toBeVisible();
    }
  } catch {
    // If it's not visible within 2s, assume it's already gone or won't show.
  }
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await dismissTour(page);
  await ensurePanel(page, "preview");
  await expect(
    page.getByRole("textbox", { name: /raw aamva payload string/i })
  ).toBeVisible({ timeout: 15_000 });
}
