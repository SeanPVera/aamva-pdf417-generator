import { test, expect } from "@playwright/test";
import { switchMobilePanel, ensureTourDismissed } from "./helpers";

// Theme regression for representative state palettes. Themes are applied
// as CSS custom properties on <html> by applyStateThemeToDocument; we
// assert those properties switch to the expected per-state values when
// the user picks a state.
//
// The values below mirror src/core/stateThemes.ts — if a palette is
// intentionally retuned, update this map. A pixel-diff snapshot was
// considered but is too sensitive to font rendering and lazy-bundle
// timing to be useful in CI; the CSS-variable contract is what the
// implementation actually guarantees.

interface ExpectedPalette {
  primary: string;
  accent: string;
  tint: string;
}

const EXPECTED: Record<string, ExpectedPalette> = {
  CA: { primary: "#003A70", accent: "#F2A900", tint: "#dbe4ed" },
  NY: { primary: "#1D3458", accent: "#D8A637", tint: "#dde2ea" },
  TX: { primary: "#BF0A30", accent: "#002868", tint: "#f8dfe4" },
  FL: { primary: "#C8102E", accent: "#FFD100", tint: "#fadfe4" },
  WA: { primary: "#0F4A2F", accent: "#FFC72C", tint: "#dde5e0" },
  DC: { primary: "#BF0A30", accent: "#002868", tint: "#f8dfe4" }
};

async function readVar(
  page: import("@playwright/test").Page,
  name: string
): Promise<string> {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

for (const [state, palette] of Object.entries(EXPECTED)) {
  test(`state theme variables: ${state}`, async ({ page }) => {
    await page.goto("/");

    // Dismiss the welcome tour if it's open, as it traps focus and obscures elements.
    await ensureTourDismissed(page);

    // Ensure the config panel is active on mobile so the state selector is focusable.
    await switchMobilePanel(page, "config");

    await page
      .getByRole("combobox", { name: /select state or territory/i })
      .selectOption(state);

    // Wait for the React effect that calls applyStateThemeToDocument to
    // flush. setProperty is synchronous once the effect runs, but the
    // effect itself is queued for after commit.
    await expect
      .poll(() => readVar(page, "--state-primary"), { timeout: 5_000 })
      .toBe(palette.primary);

    expect(await readVar(page, "--state-accent")).toBe(palette.accent);
    expect(await readVar(page, "--state-tint")).toBe(palette.tint);
  });
}
