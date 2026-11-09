import { test, expect } from "@playwright/test";
import { dismissTour, ensurePanel } from "./helpers";

async function settleInspector(page: import("@playwright/test").Page) {
  await page.goto("/");
  await dismissTour(page);
  await ensurePanel(page, "form");
  // Close any open menus / toasts that would pollute geometry assertions.
  await page.keyboard.press("Escape");
  await page.locator("[data-toast], .toast, [role='status']").evaluateAll((nodes) => {
    for (const n of nodes) (n as HTMLElement).style.display = "none";
  }).catch(() => undefined);
}

test.describe("Technical Inspector layout geometry", () => {
  test("desktop 1440 keeps Structure | Editor | Diagnostics as columns", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await settleInspector(page);

    const grid = page.locator("#record-workspace");
    const structure = page.locator(".structure-nav");
    const editor = page.locator(".record-editor");
    const diagnostics = page.locator(".diagnostics-column");
    const output = page.locator(".output-panel");

    await expect(structure).toBeVisible();
    await expect(editor).toBeVisible();
    await expect(diagnostics).toBeVisible();
    await expect(output).toBeVisible();

    const g = await grid.boundingBox();
    const s = await structure.boundingBox();
    const e = await editor.boundingBox();
    const d = await diagnostics.boundingBox();
    expect(g && s && e && d).toBeTruthy();
    if (!g || !s || !e || !d) return;

    // Columns share a row: tops within 40px, each has meaningful height.
    expect(Math.abs(s.y - e.y)).toBeLessThan(40);
    expect(Math.abs(e.y - d.y)).toBeLessThan(40);
    expect(s.x).toBeLessThan(e.x);
    expect(e.x).toBeLessThan(d.x);
    expect(e.width).toBeGreaterThan(420);
    expect(e.height).toBeGreaterThan(420);
    expect(d.width).toBeGreaterThan(280);
    expect(d.height).toBeGreaterThan(420);
    // Diagnostics is to the right of editor, not below it.
    expect(d.y + 80).toBeLessThan(e.y + e.height);
    expect(d.x).toBeGreaterThan(e.x + e.width - 20);

    // No horizontal page overflow.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1440 + 1);

    // A text field control has a usable width.
    const input = page.locator("#DCS");
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(220);

    // Header commands remain visible.
    for (const name of ["import", "scan", "compare", "batch", "versions"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    }
  });

  test("desktop 1024 keeps three columns without dumping Output under the editor", async ({
    page
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await settleInspector(page);
    const editor = page.locator(".record-editor");
    const diagnostics = page.locator(".diagnostics-column");
    const e = await editor.boundingBox();
    const d = await diagnostics.boundingBox();
    expect(e && d).toBeTruthy();
    if (!e || !d) return;
    expect(d.x).toBeGreaterThan(e.x + 100);
    expect(Math.abs(d.y - e.y)).toBeLessThan(48);
    expect(e.height).toBeGreaterThan(300);
    expect(d.width).toBeGreaterThan(240);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1024 + 1);
  });

  test("mobile 390 stacks without horizontal overflow and keeps commands reachable", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await settleInspector(page);
    await ensurePanel(page, "form");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390 + 1);
    await expect(page.getByRole("button", { name: "import", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "scan", exact: true })).toBeVisible();
    const input = page.locator("#DCS");
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
  });
});
