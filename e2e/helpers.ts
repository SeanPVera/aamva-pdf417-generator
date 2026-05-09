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
 * Utility to switch panels on mobile viewports. The panel buttons are only
 * visible when the viewport width < 1024px.
 */
export async function switchMobilePanel(page: Page, panel: "config" | "form" | "preview") {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 1024;
  if (!isMobile) return;

  const labels = { config: "Config", form: "Fields", preview: "Preview" };
  const btn = page.getByRole("button", { name: labels[panel], exact: true });

  // If the button is already "active" (via aria-current), skip clicking.
  if ((await btn.getAttribute("aria-current")) === "true") {
    return;
  }

  await btn.click();

  // On some mobile browsers (WebKit), the panel transition might take a frame.
  // Wait for the target panel's container to likely be visible.
  if (panel === "config") {
    await page.getByRole("combobox", { name: /select state or territory/i }).waitFor({ state: "visible" });
  } else if (panel === "preview") {
    await page.getByRole("heading", { name: /preview/i }).waitFor({ state: "visible" });
  }
}

/**
 * Closes the Welcome Tour if it's visible. The tour auto-opens for new users
 * and can block interactive elements or mess with tab order.
 */
export async function dismissTour(page: Page) {
  const skipBtn = page.getByRole("button", { name: /skip tour/i });
  try {
    // If it's not there within 1s, it's likely already dismissed or didn't show.
    if (await skipBtn.isVisible({ timeout: 1000 })) {
      await skipBtn.click();
    }
  } catch {
    // Ignore timeout errors
  }
}

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await switchMobilePanel(page, "config");
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
  await selectStateAndVersion(page, "CA", "10");
  await switchMobilePanel(page, "form");
  for (const [code, value] of CA_REQUIRED_FIELDS) {
    await fillField(page, code, value);
  }
  await page.keyboard.press("Tab");
}

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await switchMobilePanel(page, "preview");
  await expect(
    page.getByRole("textbox", { name: /raw aamva payload string/i })
  ).toBeVisible({ timeout: 15_000 });
}
