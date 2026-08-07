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
 * Picks a jurisdiction. The picker is a type-to-filter ARIA combobox (an input
 * plus an owned listbox), not a native <select>, so it is driven by typing the
 * code and clicking the matching option.
 */
export async function selectState(page: Page, state: string) {
  await ensurePanel(page, "config");
  const combo = page.getByRole("combobox", { name: /select state or territory/i });
  await combo.click();
  await combo.fill(state);
  const option = page.getByRole("option", { name: new RegExp(`^${state}\\s`) }).first();
  await option.waitFor({ state: "visible" });
  await option.click();
  // The listbox closes on commit; wait for it so the next interaction isn't
  // swallowed by the overlay.
  await expect(combo).toHaveAttribute("aria-expanded", "false");
}

export async function selectStateAndVersion(page: Page, state: string, version: string) {
  await dismissTour(page);
  await selectState(page, state);
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
  // Match on the label as a substring within the mobile nav rather than by
  // exact accessible name. The tabs carry status badges — "Fields" gains an
  // error count ("20 validation errors") and "Preview" a "Barcode ready"
  // marker — which fold into the button's accessible name, so an exact-name
  // lookup silently matches nothing precisely when a badge is showing.
  const tabButton = page
    .locator("nav[aria-label='Mobile panel navigation'] button")
    .filter({ hasText: labelMap[panel] });

  // Fail loudly if the tab is missing; skipping the click silently just
  // defers the failure to an unrelated "element is not visible" timeout.
  await tabButton.waitFor({ state: "visible" });

  if ((await tabButton.getAttribute("aria-current")) !== "true") {
    await tabButton.click();
    // Wait for the panel swap to land before returning control.
    await expect(tabButton).toHaveAttribute("aria-current", "true");
  }
}

/**
 * The Welcome Tour appears on first load and can obscure elements.
 * Dismiss it early so it doesn't interfere with test interactions.
 */
// The tour is shown once per browser context and its "seen" flag persists, so
// it can only ever need dismissing once per page. Tracking that lets repeat
// calls return immediately instead of each burning a full timeout waiting for
// a button that will never come back.
const tourHandled = new WeakSet<Page>();

export async function dismissTour(page: Page) {
  if (tourHandled.has(page)) return;

  const skipBtn = page.getByRole("button", { name: /skip tour/i });
  try {
    await skipBtn.waitFor({ state: "visible", timeout: 10_000 });
    await skipBtn.click();
    // Ensure the dialog is actually gone before returning control.
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } catch {
    // If the tour didn't show up (e.g. session already marked it seen),
    // just continue.
  }
  tourHandled.add(page);

  // The tour carries aria-modal, so while it is open every role-based query
  // outside it resolves to nothing. Assert it is gone here, where the failure
  // names the real cause, rather than letting it surface later as an
  // "element not found" on whatever the modal was hiding.
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(0);
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
