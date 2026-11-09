/**
 * Turns camera frames and photos into PDF417 text.
 *
 * ZXing's PDF417 detector only tries the frame as given and turned 180°. On a
 * hand-held card that is the problem: a symbol tilted by three degrees, with
 * ordinary blur and sensor noise, defeats it almost every time. On 32 simulated
 * 1080p camera scenes (symbol 650–1400px wide, tilt -6° to 10°, two blur
 * levels), reading each frame as given recovered 1. De-rotating by the measured
 * tilt and reading at a reduced width, which averages noise away, recovered 26,
 * most on the first attempt. The six misses are all the smallest symbols at
 * heavy blur or 10° of tilt — move the card closer.
 *
 * Pure functions over grayscale buffers — no DOM — so the whole path from
 * pixels to text runs under Vitest.
 */
import { BinaryBitmap, HybridBinarizer, PDF417Reader, RGBLuminanceSource } from "@zxing/library";

export interface GrayFrame {
  /** One byte per pixel, 0 = black, row-major. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * One way of reading a frame. Views are cheap to try and none wins
 * everywhere, so the live scanner cycles through them across frames.
 */
export interface ScanView {
  /** Centred fraction of the frame's width and height to read. */
  region: number;
  /** Cap on the width handed to the decoder; reading smaller averages noise away. */
  maxWidth: number;
  /** Degrees added to the measured tilt, to cover estimates that are slightly off. */
  tiltOffset: number;
  /** Read the frame as given, ignoring the measured tilt. */
  upright?: boolean;
}

/**
 * Cycled one per camera frame. A held card barely moves between frames, so
 * the cycle amounts to trying every view on the same scene within a second.
 */
export const LIVE_VIEWS: readonly ScanView[] = [
  { region: 1, maxWidth: 1280, tiltOffset: 0 },
  { region: 0.7, maxWidth: 1600, tiltOffset: 0 },
  { region: 1, maxWidth: 960, tiltOffset: 0 },
  { region: 1, maxWidth: 1280, tiltOffset: 0, upright: true },
  { region: 1, maxWidth: 1280, tiltOffset: 3 },
  { region: 1, maxWidth: 1280, tiltOffset: -3 }
];

/** A photo gets one chance, so it gets every view plus a wider sweep. */
export const STILL_VIEWS: readonly ScanView[] = [
  ...LIVE_VIEWS,
  { region: 1, maxWidth: 1600, tiltOffset: 0 },
  { region: 0.5, maxWidth: 1600, tiltOffset: 0 },
  { region: 1, maxWidth: 960, tiltOffset: 0, upright: true },
  { region: 1, maxWidth: 1280, tiltOffset: 6 },
  { region: 1, maxWidth: 1280, tiltOffset: -6 }
];

/** BT.601 luma from canvas RGBA. */
export function rgbaToGray(rgba: Uint8ClampedArray, width: number, height: number): GrayFrame {
  const data = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    data[i] = (rgba[j]! * 77 + rgba[j + 1]! * 150 + rgba[j + 2]! * 29) >> 8;
  }
  return { data, width, height };
}

/** 2×2 box average. Point-sampling a downscale aliases the bars into moiré. */
function halve(frame: GrayFrame): GrayFrame {
  const { data: src, width: w } = frame;
  const width = w >> 1;
  const height = frame.height >> 1;
  const data = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    let i = 2 * y * w;
    let o = y * width;
    for (let x = 0; x < width; x++, i += 2, o++) {
      data[o] = (src[i]! + src[i + 1]! + src[i + w]! + src[i + w + 1]! + 2) >> 2;
    }
  }
  return { data, width, height };
}

/** Lazily built half-resolution levels, shared by every view of one frame. */
export function createPyramid(frame: GrayFrame): (level: number) => GrayFrame {
  const levels = [frame];
  let last = frame;
  return (level) => {
    while (levels.length <= level && last.width >= 4) {
      last = halve(last);
      levels.push(last);
    }
    return levels[level] ?? last;
  };
}

/**
 * Degrees the bars lean from vertical, clockwise positive (y points down), in
 * (-90, 90]. A barcode turned on its side reads as about ±90.
 *
 * The dominant orientation of the brightness gradient, from the structure
 * tensor of the centred `region`. Gradients come from full-resolution
 * neighbours on a stride-2 grid: measuring on a downscaled copy instead
 * overstated a 10° tilt as 17°, because the aliased bars form moiré and moiré
 * exaggerates angle.
 */
export function estimateTilt(frame: GrayFrame, region = 0.8): number {
  const { data, width: w, height: h } = frame;
  const x0 = Math.max(1, Math.round((w * (1 - region)) / 2));
  const y0 = Math.max(1, Math.round((h * (1 - region)) / 2));
  const x1 = Math.min(w - 1, w - x0);
  const y1 = Math.min(h - 1, h - y0);
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0, i = y * w + x0; x < x1; x += 2, i += 2) {
      const gx = data[i + 1]! - data[i - 1]!;
      const gy = data[i + w]! - data[i - w]!;
      xx += gx * gx;
      yy += gy * gy;
      xy += gx * gy;
    }
  }
  if (xx + yy === 0) return 0;
  const degrees = (0.5 * Math.atan2(2 * xy, xx - yy) * 180) / Math.PI;
  return degrees === -90 ? 90 : degrees;
}

/**
 * Resamples the view's region, turned by `-angle` so the bars stand upright,
 * into a frame at most `view.maxWidth` wide. The output is the bounding box of
 * the turned region, so nothing inside it is cut off; the corners outside the
 * region read as white, like a quiet zone.
 */
export function renderView(
  pyramid: (level: number) => GrayFrame,
  view: ScanView,
  tilt: number
): GrayFrame {
  const base = pyramid(0);
  const angle = view.upright ? 0 : tilt + view.tiltOffset;
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rw = base.width * view.region;
  const rh = base.height * view.region;
  const boxW = rw * Math.abs(cos) + rh * Math.abs(sin);
  const boxH = rw * Math.abs(sin) + rh * Math.abs(cos);
  const scale = Math.min(1, view.maxWidth / boxW);
  const width = Math.max(1, Math.round(boxW * scale));
  const height = Math.max(1, Math.round(boxH * scale));

  // Sample from the coarsest level that still has at least the output's
  // resolution, so every pixel is an average rather than a point sample.
  let level = 0;
  while (2 ** -(level + 1) >= scale && base.width >> (level + 1) >= 4) level++;
  const src = pyramid(level);
  const k = 2 ** level;
  const sw = src.width;
  const sh = src.height;
  const s = src.data;

  const cx = base.width / 2;
  const cy = base.height / 2;
  const halfW = rw / 2;
  const halfH = rh / 2;
  const step = 1 / scale;
  const data = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    const dy = (y + 0.5 - height / 2) * step;
    for (let x = 0; x < width; x++) {
      const dx = (x + 0.5 - width / 2) * step;
      const ox = dx * cos - dy * sin;
      const oy = dx * sin + dy * cos;
      if (ox < -halfW || ox >= halfW || oy < -halfH || oy >= halfH) {
        data[y * width + x] = 255;
        continue;
      }
      const fxAbs = (cx + ox) / k - 0.5;
      const fyAbs = (cy + oy) / k - 0.5;
      const ix = Math.min(Math.max(Math.floor(fxAbs), 0), sw - 2);
      const iy = Math.min(Math.max(Math.floor(fyAbs), 0), sh - 2);
      const fx = Math.min(Math.max(fxAbs - ix, 0), 1);
      const fy = Math.min(Math.max(fyAbs - iy, 0), 1);
      const i = iy * sw + ix;
      const top = s[i]! + (s[i + 1]! - s[i]!) * fx;
      const bottom = s[i + sw]! + (s[i + sw + 1]! - s[i + sw]!) * fx;
      data[y * width + x] = top + (bottom - top) * fy;
    }
  }
  return { data, width, height };
}

const reader = new PDF417Reader();

/**
 * One decode attempt; null on any failure. ZXing's PDF417 code has throw paths
 * beyond its documented NotFound/Format/Checksum trio, and the `@zxing/browser`
 * scan loop this replaced stopped for good — camera off, no message — if one
 * escaped. None showed up in 2,304 attempts on simulated frames, so this is a
 * guard, not a measured failure.
 */
export function decodePdf417(frame: GrayFrame): string | null {
  if (frame.width < 8 || frame.height < 8) return null;
  try {
    const source = new RGBLuminanceSource(frame.data, frame.width, frame.height);
    return reader.decode(new BinaryBitmap(new HybridBinarizer(source))).getText();
  } catch {
    return null;
  }
}

/** Reads one view of a frame. */
export function scanView(
  frame: GrayFrame,
  view: ScanView,
  tilt = estimateTilt(frame)
): string | null {
  return decodePdf417(renderView(createPyramid(frame), view, tilt));
}

/** Returns a function that reads each frame it is given with the next view in the cycle. */
export function createFrameScanner(
  views: readonly ScanView[] = LIVE_VIEWS
): (frame: GrayFrame) => string | null {
  let next = 0;
  return (frame) => {
    const view = views[next]!;
    next = (next + 1) % views.length;
    return scanView(frame, view);
  };
}

export interface StillScanOptions {
  views?: readonly ScanView[];
  /** Checked between views; returning true abandons the scan. */
  isCancelled?: () => boolean;
  /** Awaited between views so a long scan does not freeze the page. */
  pause?: () => Promise<void>;
}

/** Tries every view of one still image until one reads. */
export async function scanStill(
  frame: GrayFrame,
  { views = STILL_VIEWS, isCancelled = () => false, pause }: StillScanOptions = {}
): Promise<string | null> {
  const pyramid = createPyramid(frame);
  const tilt = estimateTilt(frame);
  for (const view of views) {
    if (isCancelled()) return null;
    const text = decodePdf417(renderView(pyramid, view, tilt));
    if (text !== null) return text;
    if (pause) await pause();
  }
  return null;
}
