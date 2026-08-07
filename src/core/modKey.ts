// Platform-aware modifier labels. The keyboard handlers accept either Ctrl or
// Meta (see App.tsx), but every label in the UI used to read "Ctrl" — which is
// the wrong key on macOS. Resolve the label once and let the shortcut sheet and
// the tooltips share it.

export type Platform = "mac" | "other";

/** Detects the platform from the user agent. Defaults to "other" off-browser. */
export function detectPlatform(nav?: { platform?: string; userAgent?: string }): Platform {
  const source = nav ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!source) return "other";
  const hint = `${source.platform ?? ""} ${source.userAgent ?? ""}`;
  return /mac|iphone|ipad|ipod/i.test(hint) ? "mac" : "other";
}

/** The primary modifier: ⌘ on macOS, Ctrl everywhere else. */
export function modKey(platform: Platform = detectPlatform()): string {
  return platform === "mac" ? "⌘" : "Ctrl";
}

/** The secondary modifier. Spelled out on both platforms — ⇧ reads poorly inline. */
export function shiftKey(platform: Platform = detectPlatform()): string {
  return platform === "mac" ? "⇧" : "Shift";
}

/**
 * Joins modifier tokens into a display string, e.g. `["mod", "shift", "C"]` →
 * "⌘+⇧+C" on macOS and "Ctrl+Shift+C" elsewhere. Tokens other than "mod" and
 * "shift" pass through untouched.
 */
export function formatShortcut(tokens: string[], platform: Platform = detectPlatform()): string {
  return tokens.map((t) => shortcutToken(t, platform)).join("+");
}

/** Resolves a single token to its platform label. */
export function shortcutToken(token: string, platform: Platform = detectPlatform()): string {
  if (token === "mod") return modKey(platform);
  if (token === "shift") return shiftKey(platform);
  return token;
}
