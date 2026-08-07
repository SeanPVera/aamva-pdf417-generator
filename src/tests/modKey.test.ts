import { describe, it, expect } from "vitest";
import { detectPlatform, modKey, shiftKey, formatShortcut, shortcutToken } from "../core/modKey";

describe("modKey", () => {
  it("detects macOS from the platform string", () => {
    expect(detectPlatform({ platform: "MacIntel", userAgent: "" })).toBe("mac");
    expect(detectPlatform({ platform: "", userAgent: "Mozilla/5.0 (Macintosh)" })).toBe("mac");
  });

  it("detects iOS as mac (⌘ is still the primary modifier on iPad keyboards)", () => {
    expect(detectPlatform({ platform: "iPhone", userAgent: "" })).toBe("mac");
    expect(detectPlatform({ platform: "iPad", userAgent: "" })).toBe("mac");
  });

  it("falls back to other for Windows and Linux", () => {
    expect(detectPlatform({ platform: "Win32", userAgent: "" })).toBe("other");
    expect(detectPlatform({ platform: "Linux x86_64", userAgent: "" })).toBe("other");
  });

  it("returns the platform-correct modifier label", () => {
    expect(modKey("mac")).toBe("⌘");
    expect(modKey("other")).toBe("Ctrl");
    expect(shiftKey("mac")).toBe("⇧");
    expect(shiftKey("other")).toBe("Shift");
  });

  it("formats a shortcut for each platform", () => {
    expect(formatShortcut(["mod", "shift", "C"], "mac")).toBe("⌘+⇧+C");
    expect(formatShortcut(["mod", "shift", "C"], "other")).toBe("Ctrl+Shift+C");
  });

  it("passes non-modifier tokens through untouched", () => {
    expect(shortcutToken("F8", "mac")).toBe("F8");
    expect(shortcutToken("?", "other")).toBe("?");
  });
});
