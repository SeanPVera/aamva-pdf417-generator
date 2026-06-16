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
  // Detect mobile by the presence of the mobile navigation bar
  const nav = page.getByLabel("Mobile panel navigation");
  const isMobile = await nav.isVisible();
  if (!isMobile) return;

  const labelMap = { config: "Config", form: "Fields", preview: "Preview" };
  const tabButton = nav.getByRole("button", { name: labelMap[panel], exact: true });

  // Wait for the tab to be visible and stable
  await tabButton.waitFor({ state: "visible", timeout: 5000 });

  // Only click if it's not already active (aria-current is truthy)
  if ((await tabButton.getAttribute("aria-current")) !== "true") {
    // Force click to bypass any lingering overlays or animations
    await tabButton.click({ force: true });
    // WebKit/mobile-safari on CI needs a moment for the panel transition
    // and React state to settle before elements become visible/actionable.
    await page.waitForTimeout(400);
  }
}

/**
 * The Welcome Tour appears on first load and can obscure elements.
 * Dismiss it early so it doesn't interfere with test interactions.
 */
export async function dismissTour(page: Page) {
  const skipBtn = page.getByRole("button", { name: /skip tour/i });
  try {
    // The tour is gated behind a React.lazy chunk in some versions or might
    // take a moment to appear. Wait up to 3000ms for the button.
    await skipBtn.waitFor({ state: "visible", timeout: 3000 });
    // Force click to ensure it dismisses even if an animation is playing
    await skipBtn.click({ force: true });
    // Ensure the dialog is actually gone before returning control.
    // Increased timeout to allow for closing animations.
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    // Give a tiny bit of extra time for the backdrop/overlay to fade out
    await page.waitForTimeout(200);
  } catch {
    // If the tour didn't show up (e.g. session already marked it seen),
    // just continue.
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
