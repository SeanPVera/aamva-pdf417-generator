import { describe, it, expect, vi } from "vitest";
import ny from "../core/conformance/vectors/ny-v10-dl-issued.json";
import { encodePayloadToModules, rasterizeModules } from "./support/scanOracle";
import { cameraScene } from "./support/cameraScene";
import {
  LIVE_VIEWS,
  STILL_VIEWS,
  createFrameScanner,
  createPyramid,
  decodePdf417,
  estimateTilt,
  renderView,
  rgbaToGray,
  scanStill,
  scanView,
  type GrayFrame
} from "../core/scanPipeline";

const PAYLOAD = ny.expectedBytes;
const SYMBOL = rasterizeModules(encodePayloadToModules(PAYLOAD), {
  moduleWidth: 3,
  moduleHeight: 9
});

const scene = (angle: number) =>
  Math.abs(angle) === 90
    ? cameraScene(SYMBOL, { angle, width: 1000, height: 1600 })
    : cameraScene(SYMBOL, { angle });

const flat = (width: number, height: number, value: number): GrayFrame => ({
  data: new Uint8ClampedArray(width * height).fill(value),
  width,
  height
});

describe("reading a tilted symbol", () => {
  // The reason the pipeline exists. ZXing's PDF417 detector tries the frame as
  // given and turned 180°, nothing else, so a card held a few degrees off
  // level never read. Reproduced here on a clean synthetic frame.
  it.each([8, -8, 90])("ZXing alone does not read a symbol turned %s°", (angle) => {
    expect(decodePdf417(scene(angle))).toBeNull();
  });

  it.each([0, 8, -8, -12, 90])(
    "the live scanner reads a symbol turned %s° on its first frame",
    (angle) => {
      expect(createFrameScanner()(scene(angle))).toBe(PAYLOAD);
    }
  );

  it.each([0, 3, 8, -8])("measures a %s° tilt to within 1.5°", (angle) => {
    expect(Math.abs(estimateTilt(scene(angle)) - angle)).toBeLessThan(1.5);
  });

  it("reports a symbol on its side as 90°, not -90°", () => {
    expect(estimateTilt(scene(90))).toBeGreaterThan(85);
    const stripes = flat(64, 64, 255);
    // Horizontal bands two rows tall: bars lying flat.
    for (let y = 0; y < 64; y += 4) stripes.data.fill(0, y * 64, (y + 2) * 64);
    expect(estimateTilt(stripes)).toBe(90);
  });

  it("reads a still image of a tilted symbol", async () => {
    await expect(scanStill(scene(-8))).resolves.toBe(PAYLOAD);
  });
});

describe("createFrameScanner", () => {
  it("tries the next view on each frame and wraps around", () => {
    const frame = scene(8);
    // A view too small to hold the symbol, then one that reads it.
    const scan = createFrameScanner([
      { region: 0.05, maxWidth: 1280, tiltOffset: 0 },
      { region: 1, maxWidth: 1280, tiltOffset: 0 }
    ]);
    expect(scan(frame)).toBeNull();
    expect(scan(frame)).toBe(PAYLOAD);
    expect(scan(frame)).toBeNull();
  });

  it("returns null for a frame with no symbol in it", () => {
    const scan = createFrameScanner();
    for (let i = 0; i < LIVE_VIEWS.length; i++) expect(scan(flat(320, 240, 200))).toBeNull();
  });
});

describe("scanStill", () => {
  it("pauses between views and gives up after the last", async () => {
    const pause = vi.fn().mockResolvedValue(undefined);
    await expect(scanStill(flat(320, 240, 200), { pause })).resolves.toBeNull();
    expect(pause).toHaveBeenCalledTimes(STILL_VIEWS.length);
  });

  it("stops when cancelled", async () => {
    await expect(scanStill(scene(0), { isCancelled: () => true })).resolves.toBeNull();
  });
});

describe("decodePdf417", () => {
  it("returns null rather than throwing for frames it cannot use", () => {
    expect(decodePdf417(flat(4, 4, 0))).toBeNull();
    expect(decodePdf417(flat(200, 100, 255))).toBeNull();
  });

  it("reads an upright symbol directly", () => {
    expect(scanView(scene(0), LIVE_VIEWS[0])).toBe(PAYLOAD);
  });
});

describe("renderView", () => {
  const frame = flat(400, 200, 0);
  const pyramid = createPyramid(frame);

  it("crops to the region and caps the width", () => {
    const crop = renderView(
      pyramid,
      { region: 0.5, maxWidth: 5000, tiltOffset: 0, upright: true },
      0
    );
    expect([crop.width, crop.height]).toEqual([200, 100]);
    const small = renderView(
      pyramid,
      { region: 1, maxWidth: 100, tiltOffset: 0, upright: true },
      0
    );
    expect([small.width, small.height]).toEqual([100, 50]);
  });

  it("turns a symbol on its side upright by swapping the axes", () => {
    const turned = renderView(pyramid, { region: 1, maxWidth: 5000, tiltOffset: 0 }, 90);
    expect([turned.width, turned.height]).toEqual([200, 400]);
  });

  it("ignores the measured tilt for an upright view and adds the offset otherwise", () => {
    const upright = renderView(
      pyramid,
      { region: 1, maxWidth: 5000, tiltOffset: 0, upright: true },
      30
    );
    expect([upright.width, upright.height]).toEqual([400, 200]);
    const offset = renderView(pyramid, { region: 1, maxWidth: 5000, tiltOffset: 60 }, 30);
    expect([offset.width, offset.height]).toEqual([200, 400]);
  });

  it("fills the corners outside the turned region with white", () => {
    const out = renderView(
      createPyramid(flat(100, 100, 0)),
      { region: 1, maxWidth: 5000, tiltOffset: 0 },
      45
    );
    expect(out.data[0]).toBe(255);
    expect(out.data[Math.floor(out.height / 2) * out.width + Math.floor(out.width / 2)]).toBe(0);
  });
});

describe("rgbaToGray and createPyramid", () => {
  it("converts RGBA to BT.601 luma", () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 0, 255, 0, 255]);
    expect(Array.from(rgbaToGray(rgba, 3, 1).data)).toEqual([255, 0, 149]);
  });

  it("halves by averaging and stops at a tiny level", () => {
    const frame: GrayFrame = {
      data: new Uint8ClampedArray([0, 255, 0, 255, 255, 0, 255, 0]),
      width: 4,
      height: 2
    };
    const pyramid = createPyramid(frame);
    expect(pyramid(0)).toBe(frame);
    expect(Array.from(pyramid(1).data)).toEqual([128, 128]);
    expect(pyramid(9)).toBe(pyramid(1));
  });

  it("measures no tilt in a featureless frame", () => {
    expect(estimateTilt(flat(64, 64, 128))).toBe(0);
  });
});
