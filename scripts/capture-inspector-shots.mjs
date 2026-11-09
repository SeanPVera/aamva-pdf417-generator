/* eslint-disable no-undef -- page.evaluate browser callbacks */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = "docs/screenshots/technical-inspector";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

async function prep(page) {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  for (const label of ["Skip tour", "Skip", "Close", "Got it", "Not now"]) {
    const b = page.getByRole("button", { name: label, exact: false });
    if (await b.count()) {
      await b.first().click({ timeout: 1000 }).catch(() => {});
      break;
    }
  }
  const fillTools = page.locator("details.field-tools");
  if (await fillTools.count()) {
    await fillTools.locator("summary").click();
    await page
      .getByRole("button", { name: /Fill all fields with demo data|Fill synthetic sample/i })
      .first()
      .click({ force: true });
    // Close the details menu explicitly (Escape does not close <details>).
    await page.evaluate(() => {
      document.querySelectorAll("details.field-tools[open]").forEach((d) => {
        d.open = false;
      });
    });
  }
    // Return to Identity so screenshots share the same section.
  await page.getByRole("button", { name: /Identity/ }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelectorAll("[role='status']").forEach((n) => {
      if (n instanceof HTMLElement) n.style.display = "none";
    });
    const style = document.createElement("style");
    style.textContent =
      ".screenshot-proof-placeholder{min-height:140px;margin:12px;border:1px dashed #8a917f;background:repeating-linear-gradient(45deg,#eceadf 0 6px,#e2e4d8 6px 12px);display:grid;place-items:center;text-align:center;font:11px/1.45 ui-monospace,monospace;color:#5c6358;letter-spacing:.04em;padding:16px;white-space:pre-line}";
    document.head.appendChild(style);
    document.querySelectorAll(".output-panel canvas").forEach((canvas) => {
      const ph = document.createElement("div");
      ph.className = "screenshot-proof-placeholder";
      ph.textContent = "SAMPLE · NON-FUNCTIONAL PREVIEW\nNot a barcode · Not a credential";
      canvas.replaceWith(ph);
    });
  });
  await page.waitForTimeout(150);
}

const shots = [
  { name: "desktop-1440.png", size: { width: 1440, height: 1000 } },
  { name: "desktop-1024.png", size: { width: 1024, height: 768 } },
  { name: "mobile-390.png", size: { width: 390, height: 844 } }
];

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.size });
  await prep(page);
  if (shot.size.width < 500) {
    await page.getByRole("button", { name: "Form" }).click().catch(() => {});
  }
  // Ensure no open details / menus
  await page.evaluate(() => {
    document.querySelectorAll("details[open]").forEach((d) => {
      if (d.classList.contains("field-tools") || d.classList.contains("schema-details")) {
        /* leave schema closed too for clean shot */
      }
      if (d.classList.contains("field-tools")) d.open = false;
    });
  });
  await page.screenshot({ path: `${out}/${shot.name}`, fullPage: false });
  await page.close();
  console.log("wrote", shot.name, shot.size);
}

await browser.close();
console.log("done", out);
