/**
 * Pixel-level scan oracle.
 *
 * Every other correctness test in this repo compares our encoder against our
 * decoder. They share assumptions — `generator.ts` space-pads DAK to 11 and
 * `decoder.ts` strips that padding back off — so they agree with each other
 * even when both are wrong about the spec, and the suite stays green.
 *
 * This module is the one check with an outside referee in it. bwip-js draws the
 * symbol from the app's own encoder options, we rasterise it to pixels, and
 * ZXing — an independent implementation that has never heard of `generator.ts`
 * — reads it back. A mismatch means the bytes we think we are printing are not
 * the bytes a scanner recovers, which is the failure mode no self-referential
 * test can see.
 *
 * Test-only: nothing here is imported by application code, so it stays out of
 * the shipped bundle.
 */
import bwipjs from "bwip-js";
import {
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  PDF417Reader,
  RGBLuminanceSource
} from "@zxing/library";

import { PDF417_ENCODER_OPTIONS } from "../../core/barcodeDimensions";

/** A PDF417 symbol as a grid of 1 (bar) / 0 (space) modules, row-major. */
export interface ModuleMatrix {
  modules: readonly number[];
  columns: number;
  rows: number;
}

export interface RasterOptions {
  /** Pixels per module horizontally. */
  moduleWidth?: number;
  /** Pixels per module vertically. PDF417 rows are conventionally 3x tall. */
  moduleHeight?: number;
  /** Quiet zone in modules on every side. The spec minimum is 2. */
  quietZoneModules?: number;
}

export interface Raster {
  /** One byte per pixel: 0 = black, 255 = white. */
  luminance: Uint8ClampedArray;
  width: number;
  height: number;
}

export type ScanResult =
  | { ok: true; text: string }
  | { ok: false; reason: "undecodable"; error: string };

const DEFAULT_RASTER: Required<RasterOptions> = {
  moduleWidth: 2,
  moduleHeight: 6,
  quietZoneModules: 4
};

/**
 * Encode a payload to its module grid using the *application's* encoder
 * options, so a change to `eclevel`, `compact`, or a future `columns` pin is
 * re-validated through a real reader rather than silently accepted.
 *
 * `scale` and the padding options only affect rendering, not the grid, so
 * passing the whole options object through is safe.
 */
/** bwip-js returns bar/space runs for linear symbologies and a pixel grid for
 *  matrix ones. PDF417 is the latter; narrow to it rather than assuming. */
interface RawMatrixSymbol {
  pixs: number[];
  pixx: number;
}

function isMatrixSymbol(symbol: unknown): symbol is RawMatrixSymbol {
  if (typeof symbol !== "object" || symbol === null) return false;
  const candidate = symbol as { pixs?: unknown; pixx?: unknown };
  return Array.isArray(candidate.pixs) && typeof candidate.pixx === "number";
}

export function encodePayloadToModules(payload: string): ModuleMatrix {
  const result = bwipjs.raw({ ...PDF417_ENCODER_OPTIONS, text: payload });
  const symbol = Array.isArray(result) ? result[0] : undefined;
  if (!isMatrixSymbol(symbol)) {
    throw new Error("bwip-js did not return a matrix symbol for the payload");
  }

  const columns = symbol.pixx;
  const rows = symbol.pixs.length / columns;
  if (!Number.isInteger(rows)) {
    throw new Error(`bwip-js raw matrix is not rectangular (${symbol.pixs.length} / ${columns})`);
  }

  return { modules: symbol.pixs, columns, rows };
}

/** Blow a module grid up into a grayscale bitmap with a quiet zone around it. */
export function rasterizeModules(matrix: ModuleMatrix, options: RasterOptions = {}): Raster {
  const { moduleWidth, moduleHeight, quietZoneModules } = { ...DEFAULT_RASTER, ...options };

  const marginX = quietZoneModules * moduleWidth;
  const marginY = quietZoneModules * moduleHeight;
  const width = matrix.columns * moduleWidth + marginX * 2;
  const height = matrix.rows * moduleHeight + marginY * 2;

  // 255 = white everywhere, then paint the bars black.
  const luminance = new Uint8ClampedArray(width * height).fill(255);

  for (let row = 0; row < matrix.rows; row++) {
    for (let col = 0; col < matrix.columns; col++) {
      if (!matrix.modules[row * matrix.columns + col]) continue;
      for (let dy = 0; dy < moduleHeight; dy++) {
        const y = marginY + row * moduleHeight + dy;
        const rowStart = y * width + marginX + col * moduleWidth;
        for (let dx = 0; dx < moduleWidth; dx++) luminance[rowStart + dx] = 0;
      }
    }
  }

  return { luminance, width, height };
}

/** Read a rasterised symbol back with ZXing's PDF417 decoder. */
export function scanRaster(raster: Raster): ScanResult {
  const source = new RGBLuminanceSource(raster.luminance, raster.width, raster.height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);

  try {
    return { ok: true, text: new PDF417Reader().decode(bitmap, hints).getText() };
  } catch (err) {
    return {
      ok: false,
      reason: "undecodable",
      error: (err as Error)?.constructor?.name ?? "Error"
    };
  }
}

/**
 * Full round trip: payload -> symbol -> pixels -> independently decoded text.
 * The returned text should be byte-identical to the input.
 */
export function scanPayload(payload: string, options: RasterOptions = {}): ScanResult {
  return scanRaster(rasterizeModules(encodePayloadToModules(payload), options));
}

/** Index of the first differing character, or -1 when the strings match. */
export function firstDifference(actual: string, expected: string): number {
  const max = Math.max(actual.length, expected.length);
  for (let i = 0; i < max; i++) {
    if (actual[i] !== expected[i]) return i;
  }
  return -1;
}

/** Readable context around a mismatch, with control characters escaped. */
export function describeDifference(actual: string, expected: string): string {
  const at = firstDifference(actual, expected);
  if (at === -1) return "identical";
  const from = Math.max(0, at - 12);
  return (
    `byte ${at} of ${expected.length}: ` +
    `expected ${JSON.stringify(expected.slice(from, at + 12))} ` +
    `but scanned ${JSON.stringify(actual.slice(from, at + 12))}`
  );
}
