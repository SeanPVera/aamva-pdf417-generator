import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The Home Screen install path on iOS is easy to break silently: an SVG
// apple-touch-icon still "works" (Safari substitutes a page screenshot), a
// missing viewport-fit=cover still renders (every safe-area inset just
// collapses to 0). These assertions pin the details that have no visible
// failure mode in a desktop browser.

const root = resolve(__dirname, "../..");
const readText = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/** Parses width/height out of a PNG IHDR, and validates the signature. */
function pngSize(rel: string): { width: number; height: number } {
  const buf = readFileSync(resolve(root, rel));
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(buf.subarray(0, 8).equals(signature), `${rel} is not a PNG`).toBe(true);
  expect(buf.subarray(12, 16).toString("latin1"), `${rel} has no IHDR`).toBe("IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("iOS Home Screen install", () => {
  const html = readText("index.html");

  it("declares viewport-fit=cover so safe-area insets resolve", () => {
    const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]+)"/i)?.[1];
    expect(viewport).toBeTruthy();
    expect(viewport).toMatch(/viewport-fit=cover/);
  });

  it("keeps the standalone + translucent status bar meta tags", () => {
    expect(html).toMatch(/name="apple-mobile-web-app-capable"\s+content="yes"/);
    expect(html).toMatch(
      /name="apple-mobile-web-app-status-bar-style"\s+content="black-translucent"/
    );
    expect(html).toMatch(/name="apple-mobile-web-app-title"/);
  });

  it("points apple-touch-icon at a PNG, never an SVG", () => {
    const icon = html.match(/<link\s+rel="apple-touch-icon"[^>]*href="([^"]+)"/i)?.[1];
    expect(icon, "no apple-touch-icon link").toBeTruthy();
    expect(icon).toMatch(/\.png$/);
    expect(icon).not.toMatch(/\.svg$/);
  });

  it("ships a 180x180 apple-touch-icon at the referenced path", () => {
    const icon = html.match(/<link\s+rel="apple-touch-icon"[^>]*href="([^"]+)"/i)?.[1] ?? "";
    const rel = icon.replace(/^\.\//, "public/");
    expect(pngSize(rel)).toEqual({ width: 180, height: 180 });
  });

  it("pads the sticky header by the top inset", () => {
    const css = readText("src/styles/index.css");
    expect(css).toMatch(/\.header-safe-top\s*\{[^}]*env\(safe-area-inset-top/);
    expect(readText("src/components/Header.tsx")).toMatch(/header-safe-top/);
  });
});

describe("web app manifest", () => {
  const manifest = JSON.parse(readText("public/manifest.webmanifest"));

  it("uses relative start_url and scope so a project Pages subpath works", () => {
    // An absolute "/" would resolve to the org root, not /<repo>/, and the
    // installed app would open a 404.
    expect(manifest.start_url).toBe("./");
    expect(manifest.scope).toBe("./");
    expect(manifest.display).toBe("standalone");
  });

  it("declares PNG icons at 192 and 512 with matching files on disk", () => {
    const pngs = manifest.icons.filter((i: { type: string }) => i.type === "image/png");
    const sizes = pngs.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    for (const icon of pngs) {
      const [w, h] = icon.sizes.split("x").map(Number);
      expect(pngSize(icon.src.replace(/^\.\//, "public/"))).toEqual({ width: w, height: h });
    }
  });

  it("provides a maskable icon distinct from the standard one", () => {
    const maskable = manifest.icons.filter((i: { purpose?: string }) =>
      (i.purpose ?? "").split(/\s+/).includes("maskable")
    );
    expect(maskable.length).toBeGreaterThan(0);
    // A single "any maskable" entry gets cropped on Android; the artwork has
    // to be inset for maskable, which means a separate file.
    const anyIcons = manifest.icons.filter((i: { purpose?: string }) =>
      (i.purpose ?? "any").split(/\s+/).includes("any")
    );
    const overlap = maskable.some((m: { src: string }) =>
      anyIcons.some((a: { src: string }) => a.src === m.src)
    );
    expect(overlap, "an icon marked both any and maskable will crop badly").toBe(false);
  });
});
