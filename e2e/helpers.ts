import { expect, type Page } from "@playwright/test";
import { AAMVA_FIELD_GROUPS, getFieldGroup } from "../src/core/schema";

// Required-field minimum for a CA v10 DL — values chosen to satisfy every
// rule pack constraint (DAQ regex, validity span, age at issue) AND to
// avoid strict-mode-blocking advisories (DDB ≥ DBD).
//
// Ordered by section, because the form is paginated: one rung at a time, and
// every code below moves the rail. Interleaving sections the way the AAMVA
// element order does would bounce the rail a dozen times for no gain. Nothing
// here depends on fill order — the validator reads the finished record.
export const CA_REQUIRED_FIELDS: Array<[string, string]> = [
  // Identity
  ["DCS", "DOE"],
  ["DAC", "JANE"],
  ["DBB", "01011990"],
  ["DBC", "2"],
  ["DDE", "N"],
  ["DDF", "N"],
  ["DDG", "N"],
  // Address
  ["DAG", "123 MAIN ST"],
  ["DAI", "ANYTOWN"],
  ["DAK", "90001"],
  // Physical Description
  ["DAY", "BRO"],
  ["DAU", "509"],
  // License Details
  ["DBD", "01012024"],
  ["DBA", "01012028"],
  ["DAQ", "A1234567"],
  ["DCF", "ABCDEFG12345"],
  ["DCG", "USA"],
  ["DDB", "01012024"],
  // Driving Privileges
  ["DCA", "C"],
  ["DCB", "NONE"],
  ["DCD", "NONE"]
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

  // The switcher moved to the bottom bar in the kiosk redesign and was renamed
  // with it: the nav is "Mobile panels", the tabs read Setup / Form / Barcode,
  // and the active one carries aria-current="page".
  const labelMap = { config: "Setup", form: "Form", preview: "Barcode" };
  // Match on the label as a substring rather than by exact accessible name.
  // The tabs carry status badges — Form gains an error count, Barcode a tick —
  // which fold into the button's accessible name, so an exact-name lookup
  // silently matches nothing precisely when a badge is showing.
  const tabButton = page
    .locator("nav[aria-label='Mobile panels'] button")
    .filter({ hasText: labelMap[panel] });

  // Fail loudly if the tab is missing; skipping the click silently just
  // defers the failure to an unrelated "element is not visible" timeout.
  await tabButton.waitFor({ state: "visible" });

  if ((await tabButton.getAttribute("aria-current")) !== "page") {
    await tabButton.click();
    // Wait for the panel swap to land before returning control.
    await expect(tabButton).toHaveAttribute("aria-current", "page");
  }
}

/**
 * Clicks a header action that lives in the desktop action bar and, on a phone,
 * inside the "More actions" menu instead.
 *
 * The action bar is `hidden lg:flex`. Below that width the same actions are
 * menu items with shorter names — "Export JSON" rather than "Export current
 * fields as JSON" — so both names have to be supplied.
 */
export async function clickHeaderAction(page: Page, barName: RegExp, menuName: RegExp) {
  const isMobile = await page.evaluate(() => window.innerWidth < 1024);
  if (!isMobile) {
    await page.getByRole("button", { name: barName }).click();
    return;
  }
  await page.getByRole("button", { name: /more actions/i }).click();
  await page.getByRole("menuitem", { name: menuName }).click();
}

/**
 * Opens a rung of the step rail by its section label.
 *
 * Both rails are always in the DOM — the desktop one is `hidden lg:flex`, the
 * phone strip `lg:hidden` — so the `:visible` filter is what picks the one the
 * viewport is actually showing. Without it the locator is ambiguous and
 * Playwright's strict mode rejects it.
 */
export async function openSection(page: Page, label: string) {
  await ensurePanel(page, "form");
  const rail = page.locator("nav[aria-label='Form sections']:visible");
  const step = rail.getByRole("button", { name: new RegExp(escapeForRegExp(label), "i") });
  await step.waitFor({ state: "visible" });
  if ((await step.getAttribute("aria-current")) === "step") return;
  await step.click();
  await expect(step).toHaveAttribute("aria-current", "step");
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Brings a field's input onto the page.
 *
 * The form renders one section at a time, so `#DAY` simply does not exist while
 * Identity is open — this is the single most common reason a previously-green
 * spec fails after a form change. Mirrors what `handleScrollToField` does in
 * App.tsx: find the field's group, open that rung, then interact.
 *
 * The early return covers both "already on the right rung" and the filtered
 * view, where a search shows every match across every section at once.
 */
export async function revealField(page: Page, code: string) {
  await ensurePanel(page, "form");
  if ((await page.locator(`#${code}`).count()) > 0) return;

  const groupId = getFieldGroup(code);
  const group = AAMVA_FIELD_GROUPS.find((g) => g.id === groupId);
  if (!group) throw new Error(`No section for field ${code} (group ${groupId})`);
  await openSection(page, group.label);
}

/**
 * Fills a single AAMVA field, whichever control the schema earned it.
 *
 * A short enumeration (12 options or fewer) renders as a chip group — a
 * `role="radiogroup"` div carrying the field's id, with one `role="radio"`
 * button per value. Its accessible name is the human description ("Female"),
 * not the wire value ("2"), so the value is read off `data-value`. Longer
 * enumerations stay a <select>; everything else is an <input>.
 */
export async function fillField(page: Page, code: string, value: string) {
  await revealField(page, code);
  const locator = page.locator(`#${code}`);
  // `visible`, not `attached`: a section swap mounts the new inputs a commit
  // before the layout settles, and an off-screen control cannot be clicked.
  await locator.waitFor({ state: "visible" });

  if ((await locator.getAttribute("role")) === "radiogroup") {
    const chip = locator.locator(`[role="radio"][data-value="${value}"]`);
    await chip.click();
    await expect(chip).toHaveAttribute("aria-checked", "true");
    return;
  }

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

/** Waits for the lazy-loaded BarcodePreview pane to mount. */
export async function waitForPreview(page: Page) {
  await dismissTour(page);
  await ensurePanel(page, "preview");
  await expect(page.getByRole("textbox", { name: /raw aamva payload string/i })).toBeVisible({
    timeout: 15_000
  });
}
