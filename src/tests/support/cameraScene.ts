/**
 * Puts a rasterised symbol into a synthetic camera frame: turned, softened,
 * and on a darker background, the way a hand-held card reaches the scanner.
 *
 * The rotation here is written independently of `renderView` so the tests do
 * not grade the pipeline's resampler with itself.
 */
import type { GrayFrame } from "../../core/scanPipeline";
import type { Raster } from "./scanOracle";

export interface SceneOptions {
  /** Clockwise degrees (y down) the symbol is turned. */
  angle: number;
  width?: number;
  height?: number;
  /** Background luma around the white card. */
  background?: number;
  /** Box-blur passes (3×3); each softens edges by about a pixel. */
  blurPasses?: number;
}

export function cameraScene(
  symbol: Raster,
  { angle, width = 1600, height = 1000, background = 90, blurPasses = 1 }: SceneOptions
): GrayFrame {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = width / 2;
  const cy = height / 2;
  // A white card with a margin around the symbol's own quiet zone.
  const cardW = symbol.width * 1.15;
  const cardH = symbol.height * 1.6;
  let data = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Inverse map: undo the clockwise turn to find the card coordinate.
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const u = dx * cos + dy * sin;
      const v = -dx * sin + dy * cos;
      let value = background;
      if (Math.abs(u) < cardW / 2 && Math.abs(v) < cardH / 2) {
        const sx = Math.floor(u + symbol.width / 2);
        const sy = Math.floor(v + symbol.height / 2);
        value =
          sx >= 0 && sy >= 0 && sx < symbol.width && sy < symbol.height
            ? symbol.luminance[sy * symbol.width + sx]
            : 255;
      }
      data[y * width + x] = value;
    }
  }
  for (let pass = 0; pass < blurPasses; pass++) {
    const out = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let n = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const xx = x + i;
            const yy = y + j;
            if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
            sum += data[yy * width + xx];
            n++;
          }
        }
        out[y * width + x] = sum / n;
      }
    }
    data = out;
  }
  return { data, width, height };
}
