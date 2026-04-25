/**
 * State-specific color palettes.
 *
 * Each jurisdiction has a palette aligned to official state colors where
 * designated by law. If a state has no statutory colors, we use a best-guess
 * palette derived from the state flag, seal, or widely used civic branding.
 * The palette is used to theme the application header, badges and accent
 * surfaces whenever the user selects a state.
 *
 * Palette contract:
 *   - primary      Main brand color (used for header background).
 *   - primaryDark  Darker shade (used for borders / hover).
 *   - accent       Complementary highlight (used for badges & active tabs).
 *   - onPrimary    Foreground color for text placed on top of `primary`.
 *   - onAccent     Foreground color for text placed on top of `accent`.
 *   - tint         Very pale tint of `primary` (used for side surfaces).
 */
export interface StateTheme {
  primary: string;
  primaryDark: string;
  accent: string;
  onPrimary: string;
  onAccent: string;
  tint: string;
}

/**
 * Default palette — Google / AAMVA blue.
 * Used for unknown jurisdictions and as CSS variable fallback.
 */
export const DEFAULT_STATE_THEME: StateTheme = {
  primary: "#1a73e8",
  primaryDark: "#1967d2",
  accent: "#fbbc04",
  onPrimary: "#ffffff",
  onAccent: "#1a1a1a",
  tint: "#e8f0fe"
};

export const STATE_THEMES: Record<string, StateTheme> = {
  // Alabama — best guess from flag (no statutory state color pair)
  AL: {
    primary: "#A60F2D",
    primaryDark: "#7A0A20",
    accent: "#E6E6E6",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#f8e6ea"
  },
  // Alaska — best guess from flag (no statutory state color pair)
  AK: {
    primary: "#0F204B",
    primaryDark: "#081433",
    accent: "#FDB813",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dce1ee"
  },
  // Arizona — official state colors: blue + old gold
  AZ: {
    primary: "#0A3161",
    primaryDark: "#072448",
    accent: "#C9A227",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dde5f0"
  },
  // Arkansas — best guess from flag (no statutory state color pair)
  AR: {
    primary: "#BE0A30",
    primaryDark: "#8B0623",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f8dfe3"
  },
  // California — official state colors: blue + gold
  CA: {
    primary: "#003A70",
    primaryDark: "#00264A",
    accent: "#F2A900",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dbe4ed"
  },
  // Colorado — Red/blue/white with yellow 'C'
  CO: {
    primary: "#BF0D3E",
    primaryDark: "#8A092C",
    accent: "#FFCD00",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#f8dee4"
  },
  // Connecticut — Azure blue
  CT: {
    primary: "#041E42",
    primaryDark: "#02122A",
    accent: "#F4B844",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dadfeb"
  },
  // Delaware — Colonial blue & buff
  DE: {
    primary: "#003F87",
    primaryDark: "#002B5F",
    accent: "#F2D888",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae3f1"
  },
  // Florida — Crimson saltire & sunshine
  FL: {
    primary: "#C8102E",
    primaryDark: "#95001F",
    accent: "#FFD100",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#fadfe4"
  },
  // Georgia — Red/white/blue
  GA: {
    primary: "#B31B1B",
    primaryDark: "#7F1313",
    accent: "#002F6C",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f4dede"
  },
  // Hawaii — best guess (no statutory state color pair)
  HI: {
    primary: "#B22234",
    primaryDark: "#7E1624",
    accent: "#FFD166",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#f7e3e7"
  },
  // Idaho — Deep blue with gem-state gold
  ID: {
    primary: "#14284B",
    primaryDark: "#0A1833",
    accent: "#E4D87C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dde1ea"
  },
  // Illinois — Prairie blue & gold
  IL: {
    primary: "#003DA5",
    primaryDark: "#002879",
    accent: "#FFCD00",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae4f2"
  },
  // Indiana — Torch blue/gold
  IN: {
    primary: "#003B71",
    primaryDark: "#00264A",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae2ec"
  },
  // Iowa — Red/white/blue with eagle
  IA: {
    primary: "#C52132",
    primaryDark: "#931622",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f6dee1"
  },
  // Kansas — Sunflower gold on blue
  KS: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Kentucky — Official state colors blue & gold
  KY: {
    primary: "#003595",
    primaryDark: "#00246B",
    accent: "#FFB800",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae2f0"
  },
  // Louisiana — Pelican blue/gold
  LA: {
    primary: "#00205B",
    primaryDark: "#00143D",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dadfed"
  },
  // Maine — Pine tree blue with gold
  ME: {
    primary: "#0A2240",
    primaryDark: "#05162B",
    accent: "#E1AD01",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dcdfe7"
  },
  // Maryland — Calvert & Crossland red/gold/black
  MD: {
    primary: "#CA3A2D",
    primaryDark: "#962920",
    accent: "#FFD520",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#f6e0dd"
  },
  // Massachusetts — official state colors: blue, green, cranberry
  MA: {
    primary: "#1D3D8F",
    primaryDark: "#132A64",
    accent: "#7A9E3A",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dde2ef"
  },
  // Michigan — Maize and blue
  MI: {
    primary: "#00274C",
    primaryDark: "#001833",
    accent: "#FFCB05",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0e9"
  },
  // Minnesota — Deep blue & North Star green
  MN: {
    primary: "#003B5C",
    primaryDark: "#00263D",
    accent: "#78BE21",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae2e8"
  },
  // Mississippi — Magnolia flag red with gold star
  MS: {
    primary: "#97144D",
    primaryDark: "#6B0E37",
    accent: "#F5B433",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#eedde5"
  },
  // Missouri — Red/white/blue with bears
  MO: {
    primary: "#CE1126",
    primaryDark: "#97001C",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#fadfe2"
  },
  // Montana — Big Sky blue & forest green
  MT: {
    primary: "#003087",
    primaryDark: "#001E5F",
    accent: "#00653F",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#dae1ee"
  },
  // Nebraska — Cornhusker blue/gold
  NE: {
    primary: "#002F6C",
    primaryDark: "#001E47",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Nevada — official state colors: silver + blue
  NV: {
    primary: "#1D4F91",
    primaryDark: "#143761",
    accent: "#C0C0C0",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dee5ef"
  },
  // New Hampshire — Live Free blue & red
  NH: {
    primary: "#002147",
    primaryDark: "#00142E",
    accent: "#C8102E",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#dadfea"
  },
  // New Jersey — official state colors: Jersey blue + buff
  NJ: {
    primary: "#2484C6",
    primaryDark: "#1A5E8D",
    accent: "#E1B584",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#ddeff9"
  },
  // New Mexico — Zia red on gold
  NM: {
    primary: "#CE1126",
    primaryDark: "#97001C",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#fae0e3"
  },
  // New York — best guess (no statutory state color pair)
  NY: {
    primary: "#1D3458",
    primaryDark: "#12223A",
    accent: "#D8A637",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dde2ea"
  },
  // North Carolina — Red/white/blue
  NC: {
    primary: "#BF0A30",
    primaryDark: "#8C0722",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f8dfe4"
  },
  // North Dakota — Eagle blue/gold
  ND: {
    primary: "#002F6C",
    primaryDark: "#001E47",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Ohio — best guess (no statutory state color pair)
  OH: {
    primary: "#002147",
    primaryDark: "#00142F",
    accent: "#BA0C2F",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#d9dfe8"
  },
  // Oklahoma — official state colors: green + white
  OK: {
    primary: "#1F5F3A",
    primaryDark: "#153F27",
    accent: "#FFFFFF",
    onPrimary: "#ffffff",
    onAccent: "#1F5F3A",
    tint: "#dce8e1"
  },
  // Oregon — official state colors: navy blue + gold
  OR: {
    primary: "#0B1F5B",
    primaryDark: "#07133B",
    accent: "#D4AF37",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dcdfeb"
  },
  // Pennsylvania — Keystone blue/gold
  PA: {
    primary: "#003087",
    primaryDark: "#001E5F",
    accent: "#FFCD00",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae1ee"
  },
  // Rhode Island — Anchor blue & gold
  RI: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // South Carolina — official state color: indigo blue
  SC: {
    primary: "#0047AB",
    primaryDark: "#00327A",
    accent: "#E6EEF9",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dfe8f7"
  },
  // South Dakota — Sun gold on sky blue
  SD: {
    primary: "#002F6C",
    primaryDark: "#001E47",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Tennessee — Volunteer State red/blue
  TN: {
    primary: "#CE1126",
    primaryDark: "#97001C",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#fadfe2"
  },
  // Texas — Lone Star red/white/blue
  TX: {
    primary: "#BF0A30",
    primaryDark: "#8C0722",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f8dfe4"
  },
  // Utah — Beehive State navy & gold
  UT: {
    primary: "#002F6C",
    primaryDark: "#001E47",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Vermont — Green Mountain green & gold
  VT: {
    primary: "#024731",
    primaryDark: "#012E1F",
    accent: "#D4AF37",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dce4e0"
  },
  // Virginia — Old Dominion blue & gold
  VA: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#FFD700",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Washington — Evergreen State green & gold
  WA: {
    primary: "#0F4A2F",
    primaryDark: "#0A311E",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dde5e0"
  },
  // West Virginia — Mountain State blue & gold
  WV: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#EAAA00",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Wisconsin — Badger State blue & gold
  WI: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#FFCD00",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Wyoming — Bison red/white/blue
  WY: {
    primary: "#BF0A30",
    primaryDark: "#8C0722",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f8dfe4"
  },
  // District of Columbia — Stars & Stripes red/white
  DC: {
    primary: "#BF0A30",
    primaryDark: "#8C0722",
    accent: "#002868",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f8dfe4"
  },
  // American Samoa — Eagle blue/red/white
  AS: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#BF0A30",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#dae0ee"
  },
  // Guam — Chamorro blue with red border
  GU: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#BF0A30",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#dae0ee"
  },
  // US Virgin Islands — Eagle gold on white/blue
  VI: {
    primary: "#002868",
    primaryDark: "#001945",
    accent: "#FFC72C",
    onPrimary: "#ffffff",
    onAccent: "#1a1a1a",
    tint: "#dae0ee"
  },
  // Puerto Rico — Lone Star red/white/blue
  PR: {
    primary: "#B81717",
    primaryDark: "#850F0F",
    accent: "#002E86",
    onPrimary: "#ffffff",
    onAccent: "#ffffff",
    tint: "#f4dcdc"
  }
};

/**
 * Returns the palette for a given state code, falling back to the default
 * palette if the code is unknown.
 */
export function getStateTheme(code: string): StateTheme {
  return STATE_THEMES[code] ?? DEFAULT_STATE_THEME;
}

/**
 * Applies the state palette to `<html>` as CSS custom properties so that
 * stylesheets can reference them (e.g. `var(--state-primary)`).
 */
export function applyStateThemeToDocument(code: string, doc: Document = document): void {
  const theme = getStateTheme(code);
  const root = doc.documentElement;
  root.style.setProperty("--state-primary", theme.primary);
  root.style.setProperty("--state-primary-dark", theme.primaryDark);
  root.style.setProperty("--state-secondary", theme.tint);
  root.style.setProperty("--state-accent", theme.accent);
  root.style.setProperty("--state-background", theme.tint);
  root.style.setProperty("--state-surface", "#ffffff");
  root.style.setProperty("--state-badge", theme.primaryDark);
  root.style.setProperty("--state-on-primary", theme.onPrimary);
  root.style.setProperty("--state-on-accent", theme.onAccent);
  root.style.setProperty("--state-tint", theme.tint);
  root.setAttribute("data-state", code);
  root.setAttribute("data-state-theme", code);
}
