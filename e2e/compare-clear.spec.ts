import { test, expect } from "@playwright/test";
import { dismissTour } from "./helpers";

test.describe("Compare View Clearing", () => {
  test("loading payloads and then clearing them independently resets state", async ({ page }) => {
    await page.goto("/");
    await dismissTour(page);

    // Open Compare Modal
    await page.getByRole("button", { name: "Compare" }).click();

    // Verify modal title is visible
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Compare Two Payloads" })).toBeVisible();

    const payloadA = {
      state: "CA",
      version: "10",
      DAQ: "D1234567"
    };
    const payloadB = {
      state: "CA",
      version: "10",
      DAQ: "D7654321"
    };

    const fileBufferA = Buffer.from(JSON.stringify(payloadA, null, 2));
    const fileBufferB = Buffer.from(JSON.stringify(payloadB, null, 2));

    // Upload Payload A
    await page.getByLabel("Load JSON payload A").setInputFiles({
      name: "payloadA.json",
      mimeType: "application/json",
      buffer: fileBufferA
    });

    // Verify Payload A loaded (scoped to dialog to avoid toast conflicts)
    await expect(dialog.getByText("payloadA.json", { exact: true })).toBeVisible();

    // Upload Payload B
    await page.getByLabel("Load JSON payload B").setInputFiles({
      name: "payloadB.json",
      mimeType: "application/json",
      buffer: fileBufferB
    });

    // Verify Payload B loaded (scoped to dialog)
    await expect(dialog.getByText("payloadB.json", { exact: true })).toBeVisible();

    // Clear Payload A
    await page.getByRole("button", { name: "Clear Payload A" }).click();

    // Verify Payload A is cleared
    await expect(dialog.getByText("payloadA.json", { exact: true })).not.toBeVisible();
    await expect(dialog.getByText("payloadB.json", { exact: true })).toBeVisible();

    // Clear Payload B
    await page.getByRole("button", { name: "Clear Payload B" }).click();

    // Verify Payload B is cleared
    await expect(dialog.getByText("payloadB.json", { exact: true })).not.toBeVisible();
  });
});
