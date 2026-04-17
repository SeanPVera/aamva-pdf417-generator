export interface StatePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  badge: string;
}

const BLUE = "#003f87";
const GOLD = "#ffb81c";

/**
 * State color palettes keyed by jurisdiction code.
 *
 * Where a jurisdiction has legislated official colors, those are used as the base.
 * Where no official statewide colors exist, palette values are derived from official
 * state flag/branding colors to preserve a consistent themed UX.
 */
export const STATE_PALETTES: Record<string, StatePalette> = {
  AL: { primary: "#b22234", secondary: "#ffffff", accent: "#002868", background: "#f9f2f3", surface: "#ffffff", badge: "#8f1b2a" },
  AK: { primary: "#0f1d4d", secondary: "#ffd700", accent: "#3f5fb3", background: "#f3f5fb", surface: "#ffffff", badge: "#0a1436" },
  AZ: { primary: "#003f87", secondary: "#b08d57", accent: "#e56020", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  AR: { primary: "#bf0a30", secondary: "#ffffff", accent: "#002868", background: "#faf4f6", surface: "#ffffff", badge: "#8f0724" },
  CA: { primary: "#003262", secondary: "#fdb515", accent: "#c4820e", background: "#f5f7fb", surface: "#ffffff", badge: "#022446" },
  CO: { primary: "#002868", secondary: "#c8102e", accent: "#ffd700", background: "#f4f7fb", surface: "#ffffff", badge: "#001b49" },
  CT: { primary: "#002868", secondary: "#ffffff", accent: "#fdb913", background: "#f4f7fb", surface: "#ffffff", badge: "#001d4d" },
  DE: { primary: "#2f5d9a", secondary: "#c8ad7f", accent: "#6f8fb8", background: "#f5f8fc", surface: "#ffffff", badge: "#234878" },
  FL: { primary: "#0021a5", secondary: "#bf0a30", accent: "#ffffff", background: "#f4f6fb", surface: "#ffffff", badge: "#00187a" },
  GA: { primary: "#bf0a30", secondary: "#002868", accent: "#ffffff", background: "#faf4f6", surface: "#ffffff", badge: "#8f0724" },
  HI: { primary: "#c8102e", secondary: "#0052a5", accent: "#ffd100", background: "#fbf5f6", surface: "#ffffff", badge: "#941020" },
  ID: { primary: "#003f87", secondary: "#cfb87c", accent: "#9b7f46", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  IL: { primary: "#13294b", secondary: "#e84a27", accent: "#ffffff", background: "#f4f6fa", surface: "#ffffff", badge: "#0d1d37" },
  IN: { primary: "#003f87", secondary: "#ffb81c", accent: "#1c5aa6", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  IA: { primary: "#003f87", secondary: "#ffffff", accent: "#bf0a30", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  KS: { primary: "#0052a5", secondary: "#ffd100", accent: "#ffffff", background: "#f3f7fc", surface: "#ffffff", badge: "#003e7f" },
  KY: { primary: BLUE, secondary: "#ffffff", accent: GOLD, background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  LA: { primary: "#003f87", secondary: "#ffffff", accent: "#ffb81c", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  ME: { primary: "#0a3161", secondary: "#d39e00", accent: "#b22234", background: "#f4f7fb", surface: "#ffffff", badge: "#08264a" },
  MD: { primary: "#000000", secondary: "#e03c31", accent: "#ffcd00", background: "#f7f6f3", surface: "#ffffff", badge: "#1a1a1a" },
  MA: { primary: "#003f87", secondary: "#2e8b57", accent: "#b31b34", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  MI: { primary: "#003f87", secondary: "#ffcb05", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  MN: { primary: "#003f87", secondary: "#78be20", accent: "#ffcd00", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  MS: { primary: "#0c2340", secondary: "#b31942", accent: "#ffd100", background: "#f3f6fa", surface: "#ffffff", badge: "#091a2f" },
  MO: { primary: "#003f87", secondary: "#bf0a30", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  MT: { primary: "#003f87", secondary: "#ffb81c", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  NE: { primary: "#003f87", secondary: "#d4af37", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  NV: { primary: "#004b8d", secondary: "#c0c0c0", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#003666" },
  NH: { primary: "#002868", secondary: "#b22234", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#001d4d" },
  NJ: { primary: "#2484c6", secondary: "#e1b584", accent: "#ffffff", background: "#f3f8fc", surface: "#ffffff", badge: "#1b689d" },
  NM: { primary: "#ffcc00", secondary: "#bf0a30", accent: "#ffffff", background: "#fffaf0", surface: "#ffffff", badge: "#c79d00" },
  NY: { primary: "#003f87", secondary: "#6ea4d9", accent: "#f2a900", background: "#f4f7fb", surface: "#ffffff", badge: "#002d63" },
  NC: { primary: "#bf0a30", secondary: "#002868", accent: "#ffffff", background: "#faf4f6", surface: "#ffffff", badge: "#8f0724" },
  ND: { primary: "#002868", secondary: "#f2a900", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#001d4d" },
  OH: { primary: "#041e42", secondary: "#ba0c2f", accent: "#ffffff", background: "#f3f6fa", surface: "#ffffff", badge: "#03152f" },
  OK: { primary: "#00965e", secondary: "#ffffff", accent: "#c99700", background: "#f2faf7", surface: "#ffffff", badge: "#007046" },
  OR: { primary: "#0d2b55", secondary: "#ffb81c", accent: "#ffffff", background: "#f3f6fa", surface: "#ffffff", badge: "#0a1f3f" },
  PA: { primary: "#012169", secondary: "#ffcd00", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#01184d" },
  RI: { primary: "#f7c600", secondary: "#ffffff", accent: "#0057b8", background: "#fffdf3", surface: "#ffffff", badge: "#b58f00" },
  SC: { primary: "#1d4f91", secondary: "#ffffff", accent: "#0f2f5b", background: "#f3f7fc", surface: "#ffffff", badge: "#143765" },
  SD: { primary: "#005eb8", secondary: "#ffcd00", accent: "#ffffff", background: "#f3f7fc", surface: "#ffffff", badge: "#00468a" },
  TN: { primary: "#c8102e", secondary: "#0c2340", accent: "#ffffff", background: "#fbf5f6", surface: "#ffffff", badge: "#941020" },
  TX: { primary: "#002868", secondary: "#bf0a30", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#001d4d" },
  UT: { primary: "#0c2340", secondary: "#ffb81c", accent: "#ffffff", background: "#f3f6fa", surface: "#ffffff", badge: "#091a2f" },
  VT: { primary: "#154734", secondary: "#f2a900", accent: "#ffffff", background: "#f2f8f5", surface: "#ffffff", badge: "#103527" },
  VA: { primary: "#002868", secondary: "#cfb87c", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#001d4d" },
  WA: { primary: "#295135", secondary: "#b7a57a", accent: "#ffffff", background: "#f2f7f4", surface: "#ffffff", badge: "#1f3d27" },
  WV: { primary: "#002f6c", secondary: "#d4af37", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#00224f" },
  WI: { primary: "#002f6c", secondary: "#ffc72c", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#00224f" },
  WY: { primary: "#5b2c83", secondary: "#ffc72c", accent: "#ffffff", background: "#f7f3fb", surface: "#ffffff", badge: "#432061" },
  DC: { primary: "#c8102e", secondary: "#ffffff", accent: "#002868", background: "#fbf5f6", surface: "#ffffff", badge: "#941020" },
  AS: { primary: "#002868", secondary: "#bf0a30", accent: "#ffffff", background: "#f4f7fb", surface: "#ffffff", badge: "#001d4d" },
  GU: { primary: "#0033a0", secondary: "#c8102e", accent: "#00a3e0", background: "#f3f7fc", surface: "#ffffff", badge: "#002978" },
  VI: { primary: "#0c2340", secondary: "#ffcd00", accent: "#ffffff", background: "#f3f6fa", surface: "#ffffff", badge: "#091a2f" },
  PR: { primary: "#0050f0", secondary: "#ed0000", accent: "#ffffff", background: "#f3f6fd", surface: "#ffffff", badge: "#003cb5" }
};

export const DEFAULT_STATE_PALETTE: StatePalette = {
  primary: "#1b3568",
  secondary: "#dce6f0",
  accent: "#243f7a",
  background: "#edf1f6",
  surface: "#ffffff",
  badge: "#14295a"
};

export function getPaletteForState(stateCode: string): StatePalette {
  return STATE_PALETTES[stateCode] || DEFAULT_STATE_PALETTE;
}
