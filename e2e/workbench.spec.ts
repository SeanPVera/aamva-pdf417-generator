import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { scanRaster } from "../src/tests/support/scanOracle";
import { generateAAMVAPayload } from "../src/core/generator";
import { getFieldsForStateAndVersion } from "../src/core/schema";
import { decodeAAMVAFormat } from "../src/core/decoder";
import { CA_REQUIRED_FIELDS, ensurePanel, fillCaliforniaForm, waitForPreview } from "./helpers";
import ca from "../src/core/conformance/vectors/ca-v10-dl-baseline.json";

test("downloaded PNG survives an independent pixel-level PDF417 decode", async ({ page }) => {
  await page.goto("/");
  await fillCaliforniaForm(page);
  await waitForPreview(page);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export barcode as PNG", exact: true }).click()
  ]);
  const encoded = (await readFile((await download.path())!)).toString("base64");
  const raster = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const luminance = [],
      alpha = [];
    for (let i = 0; i < pixels.length; i += 4) {
      luminance.push(pixels[i]!);
      alpha.push(pixels[i + 3]!);
    }
    return {
      width: canvas.width,
      height: canvas.height,
      luminance,
      opaque: alpha.every((a) => a === 255)
    };
  }, encoded);
  expect(raster.opaque).toBe(true);
  expect(raster.luminance.slice(0, raster.width).every((v) => v === 255)).toBe(true);
  const scanned = scanRaster({ ...raster, luminance: new Uint8ClampedArray(raster.luminance) });
  expect(scanned.ok, JSON.stringify(scanned)).toBe(true);
  if (!scanned.ok) throw new Error(scanned.error);
  const expected = generateAAMVAPayload(
    "CA",
    "10",
    getFieldsForStateAndVersion("CA", "10"),
    Object.fromEntries(CA_REQUIRED_FIELDS),
    { strictMode: true }
  );
  expect(scanned.text).toBe(expected);
  expect(decodeAAMVAFormat(scanned.text).data).toMatchObject({
    DCS: "DOE",
    DAC: "JANE",
    DAQ: "A1234567",
    DAJ: "CA"
  });
});

test("failed import preserves input and focus; ID import and undo are atomic", async ({ page }) => {
  await page.goto("/");
  await ensurePanel(page, "form");
  await page.locator("#DCS").fill("BEFORE");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const source = page.getByLabel("Source data", { exact: true });
  await source.fill('{"state":"ZZ","DCS":"AFTER"}');
  await page.getByRole("button", { name: "Import record", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Unknown issuing jurisdiction");
  await expect(source).toHaveValue('{"state":"ZZ","DCS":"AFTER"}');
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations
  ).toEqual([]);
  await source.fill(
    '{"state":"NY","version":"10","subfileType":"ID","DCS":"AFTER","FOO":"preserved"}'
  );
  await page.getByRole("button", { name: "Import record", exact: true }).click();
  await ensurePanel(page, "config");
  await expect(
    page.getByRole("combobox", { name: "Select subfile type", exact: true })
  ).toHaveValue("ID");
  await page.keyboard.press("Control+z");
  await expect(
    page.getByRole("combobox", { name: "Select subfile type", exact: true })
  ).toHaveValue("DL");
  await ensurePanel(page, "form");
  await expect(page.locator("#DCS")).toHaveValue("BEFORE");
});

test("raw clipboard import preserves CR terminators through the textarea", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.getByLabel("Source data", { exact: true }).evaluate((element, payload) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => payload } });
    element.dispatchEvent(event);
  }, ca.expectedBytes);
  await page.getByRole("button", { name: "Import record", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await waitForPreview(page);
  await expect(page.getByLabel("Payload source", { exact: true })).toHaveValue("source");
  await expect(page.getByRole("textbox", { name: "Raw AAMVA payload string" })).toHaveValue(
    ca.expectedBytes.replace(/\r/g, "\n")
  );
});

test("erasing removes the record and prevents undo from recovering it", async ({ page }) => {
  await page.goto("/");
  await ensurePanel(page, "form");
  await page.locator("#DCS").fill("SYNTHETIC");
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await page.getByRole("button", { name: /Erase record & history/ }).click();
  await page.getByRole("button", { name: "Erase record", exact: true }).click();
  await page.keyboard.press("Control+z");
  await expect(page.locator("#DCS")).toHaveValue("");
});

test("radio and inspector tab groups work with arrow keys", async ({ page }) => {
  await page.goto("/");
  await ensurePanel(page, "form");
  const group = page.getByRole("radiogroup", { name: "DBC Sex", exact: true });
  await group.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: /sex of record: female/i })).toBeChecked();
  await waitForPreview(page);
  await page.getByRole("tab", { name: "Payload", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^Validation/ })).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: /^Validation/ })).toBeVisible();
});

for (const width of [320, 390, 768, 1024, 1920]) {
  test(`workspace has no horizontal page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await ensurePanel(page, "form");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width
    );
    await ensurePanel(page, "preview");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width
    );
  });
}

test("version reference is readable and keyboard-scrollable", async ({ page }) => {
  await page.goto("/");
  await ensurePanel(page, "config");
  await page.getByText("Schema notes & version reference", { exact: true }).click();
  await page.getByRole("button", { name: "Version Browser", exact: true }).click();
  await expect(page.getByRole("table", { name: /Fields for AAMVA version/ })).toBeVisible();
  await page.getByRole("region", { name: "Version field reference" }).focus();
  await expect(page.getByRole("region", { name: "Version field reference" })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations
  ).toEqual([]);
});

test("comparison, batch errors, and scanner are accessible and close with Escape", async ({
  page
}) => {
  await page.goto("/");
  await ensurePanel(page, "form");
  await page.getByText("Fill tools", { exact: true }).click();
  await page.getByRole("button", { name: "Fill all fields with demo data" }).click();
  await page.getByText("Fill tools", { exact: true }).click();
  await page.locator("#DCS").fill("SYNTHETIC");
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await page.getByRole("button", { name: "Compare payloads", exact: true }).click();
  await page.getByRole("button", { name: "Use active form for payload A" }).click();
  await page.getByRole("button", { name: "Use active form for payload B" }).click();
  await expect(page.getByRole("table", { name: "Payload field comparison" })).toContainText(
    "SYNTHETIC"
  );
  await page.getByRole("region", { name: "Comparison results" }).focus();
  await expect(page.getByRole("region", { name: "Comparison results" })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tools", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await page.getByRole("button", { name: "Batch CSV processing", exact: true }).click();
  await page.getByLabel("Select batch file", { exact: true }).setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("[null]")
  });
  await expect(page.getByText(/Each JSON batch row must be a record object/)).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Scan barcode", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Scan DL/ID Barcode" })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Scan barcode", exact: true })).toBeFocused();
});
