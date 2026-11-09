import { test as base, expect, type LaunchOptions } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vector from "../src/core/conformance/vectors/ny-v10-dl-issued.json";
import { encodePayloadToModules, rasterizeModules } from "../src/tests/support/scanOracle";
import { cameraScene } from "../src/tests/support/cameraScene";
import type { GrayFrame } from "../src/core/scanPipeline";
import { dismissTour, revealField } from "./helpers";

// The only check that drives the real camera path: getUserMedia → <video> →
// canvas → pixel pipeline → decoder → form. Chromium can stand a video file
// in for the webcam; the file is a 720p frame of a licence barcode held 7°
// off level, which ZXing alone does not read.

/** Y4M (4:2:0) with neutral chroma — what Chromium's fake capture device reads. */
function toY4m(frame: GrayFrame): Buffer {
  const header = Buffer.from(`YUV4MPEG2 W${frame.width} H${frame.height} F15:1 Ip A1:1 C420jpeg\n`);
  const chroma = Buffer.alloc((frame.width / 2) * (frame.height / 2) * 2, 128);
  return Buffer.concat([header, Buffer.from("FRAME\n"), Buffer.from(frame.data), chroma]);
}

const CAMERA_FILE = join(tmpdir(), `aamva-scanner-e2e-${process.pid}.y4m`);
const symbol = rasterizeModules(encodePayloadToModules(vector.expectedBytes), {
  moduleWidth: 3,
  moduleHeight: 9
});
writeFileSync(CAMERA_FILE, toY4m(cameraScene(symbol, { angle: 7, width: 1280, height: 720 })));

const test = base.extend<object, { launchOptions: LaunchOptions }>({
  launchOptions: [
    async ({ launchOptions }, use) => {
      await use({
        ...launchOptions,
        args: [
          ...(launchOptions.args ?? []),
          "--use-fake-device-for-media-stream",
          "--use-fake-ui-for-media-stream",
          `--use-file-for-fake-video-capture=${CAMERA_FILE}`
        ]
      });
    },
    { scope: "worker" }
  ]
});

test.skip(({ browserName }) => browserName !== "chromium", "fake camera input is Chromium-only");

test("reads a tilted licence barcode from the camera on a first visit", async ({ page }) => {
  // The flag that auto-accepts the permission prompt also makes Chromium
  // reveal camera IDs early. A real first visit does not: until access is
  // granted every camera has a blank deviceId, which is what kept the old
  // scanner from ever opening one. Put that behaviour back.
  await page.addInitScript(() => {
    const media = navigator.mediaDevices;
    const enumerate = media.enumerateDevices.bind(media);
    const open = media.getUserMedia.bind(media);
    let granted = false;
    media.getUserMedia = async (constraints) => {
      const stream = await open(constraints);
      granted = true;
      return stream;
    };
    media.enumerateDevices = async () => {
      const devices = await enumerate();
      if (granted) return devices;
      return devices.map(
        (d) =>
          ({
            deviceId: "",
            groupId: "",
            kind: d.kind,
            label: "",
            toJSON: () => ({})
          }) as MediaDeviceInfo
      );
    };
  });

  await page.goto("/");
  await dismissTour(page);
  await page.getByRole("button", { name: "Scan barcode", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Scan DL/ID Barcode" });
  await expect(dialog).toBeVisible();

  await expect(page.getByText(/Scanned NY v10/)).toBeVisible({ timeout: 15_000 });
  await expect(dialog).toBeHidden();

  await revealField(page, "DAQ");
  await expect(page.locator("#DAQ")).toHaveValue(vector.input.DAQ);
});
