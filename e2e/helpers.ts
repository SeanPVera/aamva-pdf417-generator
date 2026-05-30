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

  if ((await tabButton.count()) > 0) {
    const current = await tabButton.getAttribute("aria-current");
    if (current !== "true") {
      // Use force: true to ensure we click even if the tour or a transition
      // backdrop is momentarily in the way.
      await tabButton.click({ force: true });
      // Ensure transition is complete and DOM has updated
      await expect(tabButton).toHaveAttribute("aria-current", "true", { timeout: 5000 });
      // Buffer for React state to propagate to visibility classes and for
      // CSS transitions (150ms in Tailwind) to settle.
      await page.waitForTimeout(300);
    }
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
    // The tour is gated behind a React.lazy chunk. In CI, this can take a
    // moment to appear. Wait up to 3s.
    await skipBtn.waitFor({ state: "visible", timeout: 3000 });
    await skipBtn.click({ force: true });
    // Also try Escape as a fallback
    await page.keyboard.press("Escape");
    // Ensure the dialog is actually gone before returning control.
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  } catch (e) {
    // If the tour showed up but we failed to dismiss it, that's a real error.
    // If it never showed up, that's fine (e.g. session already marked seen).
    if (await dialog.isVisible()) {
      throw new Error(`Failed to dismiss Welcome Tour: ${e}`);
    }
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
