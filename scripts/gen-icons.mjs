#!/usr/bin/env node
// Rasterizes the app icon to PNG at the sizes iOS and Android need.
//
// Why this exists: iOS ignores an SVG `apple-touch-icon` and falls back to a
// screenshot of the page, so a Home Screen install needs real PNGs. Rather
// than add an image toolchain (sharp/canvas) to an app that has no other use
// for one, this draws the same shapes as public/icons/icon-512.svg into an
// RGBA buffer and encodes PNG with Node's built-in zlib.
//
// Run: npm run icons:gen

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const iconsDir = path.join(rootDir, "public", "icons");

// ─── Geometry, in the 512×512 coordinate space of icon-512.svg ──────────────

const NAVY = [0x0f, 0x17, 0x2a];
const WHITE = [0xff, 0xff, 0xff];
const INK = [0x11, 0x18, 0x27];
const BLUE = [0x25, 0x63, 0xeb];

// [x, width] pairs for the PDF417 bars; all share y=146, height=220.
const BARS = [
  [86, 48],
  [150, 20],
  [182, 32],
  [226, 16],
  [252, 36],
  [298, 20],
  [330, 44],
  [386, 28]
];

function roundRect(x, y, w, h, r, color) {
  return { kind: "roundRect", x, y, w, h, r, color };
}

function circle(cx, cy, r, color) {
  return { kind: "circle", cx, cy, r, color };
}

// A stroked line with round caps is the set of points within halfWidth of the
// segment, which is exactly a distance-to-segment test.
function capsule(x1, y1, x2, y2, width, color) {
  return { kind: "capsule", x1, y1, x2, y2, r: width / 2, color };
}

// The artwork minus its background plate, so callers can choose a rounded
// plate (web icons) or a full-bleed square (Apple, which applies its own mask).
function foreground() {
  return [
    roundRect(54, 112, 404, 288, 40, WHITE),
    ...BARS.map(([x, w]) => roundRect(x, 146, w, 220, 0, INK)),
    circle(388, 100, 42, BLUE),
    capsule(372, 100, 404, 100, 8, WHITE),
    capsule(388, 84, 388, 116, 8, WHITE)
  ];
}

// `inset` shrinks the artwork toward the center, leaving a margin of
// background. Android maskable icons crop to a circle of 80% diameter, and
// iOS rounds its corners aggressively, so both need breathing room.
function scaleAbout(shapes, factor, center = 256) {
  const map = (v) => center + (v - center) * factor;
  const len = (v) => v * factor;
  return shapes.map((s) => {
    if (s.kind === "circle") {
      return { ...s, cx: map(s.cx), cy: map(s.cy), r: len(s.r) };
    }
    if (s.kind === "capsule") {
      return { ...s, x1: map(s.x1), y1: map(s.y1), x2: map(s.x2), y2: map(s.y2), r: len(s.r) };
    }
    return { ...s, x: map(s.x), y: map(s.y), w: len(s.w), h: len(s.h), r: len(s.r) };
  });
}

// ─── Hit testing ────────────────────────────────────────────────────────────

function insideRoundRect(px, py, s) {
  if (px < s.x || py < s.y || px > s.x + s.w || py > s.y + s.h) return false;
  const r = Math.min(s.r, s.w / 2, s.h / 2);
  if (r <= 0) return true;
  // Only the four corner boxes can fall outside; everything else is inside
  // the plus-shaped union of the two inner rectangles.
  const cx = px < s.x + r ? s.x + r : px > s.x + s.w - r ? s.x + s.w - r : px;
  const cy = py < s.y + r ? s.y + r : py > s.y + s.h - r ? s.y + s.h - r : py;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideCircle(px, py, s) {
  const dx = px - s.cx;
  const dy = py - s.cy;
  return dx * dx + dy * dy <= s.r * s.r;
}

function insideCapsule(px, py, s) {
  const vx = s.x2 - s.x1;
  const vy = s.y2 - s.y1;
  const lenSq = vx * vx + vy * vy;
  let t = lenSq === 0 ? 0 : ((px - s.x1) * vx + (py - s.y1) * vy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (s.x1 + t * vx);
  const dy = py - (s.y1 + t * vy);
  return dx * dx + dy * dy <= s.r * s.r;
}

function contains(px, py, s) {
  if (s.kind === "circle") return insideCircle(px, py, s);
  if (s.kind === "capsule") return insideCapsule(px, py, s);
  return insideRoundRect(px, py, s);
}

// Painter's algorithm: last shape containing the point wins. Every shape is
// opaque, so a miss on all of them means transparent.
function sampleScene(px, py, shapes) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (contains(px, py, shapes[i])) return shapes[i].color;
  }
  return null;
}

// ─── Rasterizer ─────────────────────────────────────────────────────────────

const SUBSAMPLES = 4; // 4×4 grid per pixel

function rasterize(shapes, size) {
  const scale = 512 / size;
  const step = 1 / SUBSAMPLES;
  const offset = step / 2;
  const total = SUBSAMPLES * SUBSAMPLES;
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;

      for (let sy = 0; sy < SUBSAMPLES; sy++) {
        for (let sx = 0; sx < SUBSAMPLES; sx++) {
          const color = sampleScene(
            (x + offset + sx * step) * scale,
            (y + offset + sy * step) * scale,
            shapes
          );
          if (!color) continue;
          r += color[0];
          g += color[1];
          b += color[2];
          hits++;
        }
      }

      const at = (y * size + x) * 4;
      if (hits === 0) continue;
      // Un-premultiply: average color over covered samples, alpha = coverage.
      pixels[at] = Math.round(r / hits);
      pixels[at + 1] = Math.round(g / hits);
      pixels[at + 2] = Math.round(b / hits);
      pixels[at + 3] = Math.round((hits / total) * 255);
    }
  }

  return pixels;
}

// ─── PNG encoding ───────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Filter type 1 (Sub) per scanline: flat horizontal runs collapse to zeros,
  // which deflate then packs to almost nothing.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 1;
    for (let i = 0; i < stride; i++) {
      const left = i >= 4 ? pixels[y * stride + i - 4] : 0;
      raw[rowStart + 1 + i] = (pixels[y * stride + i] - left) & 0xff;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// ─── Outputs ────────────────────────────────────────────────────────────────

const TARGETS = [
  {
    // iOS Home Screen. Apple masks the icon itself, so the plate is a full
    // square — a pre-rounded source would show a double-rounded corner.
    file: "apple-touch-icon.png",
    size: 180,
    shapes: [roundRect(0, 0, 512, 512, 0, NAVY), ...scaleAbout(foreground(), 0.86)]
  },
  { file: "icon-192.png", size: 192, shapes: [roundRect(0, 0, 512, 512, 96, NAVY), ...foreground()] },
  { file: "icon-512.png", size: 512, shapes: [roundRect(0, 0, 512, 512, 96, NAVY), ...foreground()] },
  {
    // Android maskable: full-bleed plate, artwork inside the 80% safe zone.
    file: "icon-maskable-512.png",
    size: 512,
    shapes: [roundRect(0, 0, 512, 512, 0, NAVY), ...scaleAbout(foreground(), 0.72)]
  }
];

mkdirSync(iconsDir, { recursive: true });

for (const target of TARGETS) {
  const png = encodePng(rasterize(target.shapes, target.size), target.size);
  writeFileSync(path.join(iconsDir, target.file), png);
  console.log(`${target.file.padEnd(26)} ${target.size}×${target.size}  ${png.length} bytes`);
}
