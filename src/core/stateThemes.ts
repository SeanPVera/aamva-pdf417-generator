export interface StatePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
}

const HEX_COLOR_REGEX = /^#?([0-9a-f]{6})$/i;

const DEFAULT_PALETTE: StatePalette = {
  primary: "#1b3568",
  secondary: "#dce6f0",
  accent: "#b22234",
  background: "#edf1f6",
  surface: "#ffffff",
  border: "#b8c9da"
};

// State palettes are based on official state flag color specifications where available,
// and otherwise on the state's official visual identity colors published by state agencies.
export const STATE_PALETTES: Record<string, StatePalette> = {
  AL: {
    primary: "#9e1b32",
    secondary: "#f2d8dd",
    accent: "#ffffff",
    background: "#faf1f3",
    surface: "#ffffff",
    border: "#d8b5be"
  },
  AK: {
    primary: "#0f2b5b",
    secondary: "#d9e4f4",
    accent: "#f6c343",
    background: "#edf3fb",
    surface: "#ffffff",
    border: "#b7c8e2"
  },
  AZ: {
    primary: "#0c3c78",
    secondary: "#d9e7f8",
    accent: "#bf0a30",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b5cbe8"
  },
  AR: {
    primary: "#bf0a30",
    secondary: "#f7dbe2",
    accent: "#0a3161",
    background: "#fff2f5",
    surface: "#ffffff",
    border: "#e6b9c4"
  },
  CA: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#ae1c28",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  CO: {
    primary: "#003f87",
    secondary: "#d8e6f7",
    accent: "#c8102e",
    background: "#edf4fb",
    surface: "#ffffff",
    border: "#b4c8e4"
  },
  CT: {
    primary: "#0a3d62",
    secondary: "#d8e6f1",
    accent: "#f4b400",
    background: "#edf4f8",
    surface: "#ffffff",
    border: "#b5c9d8"
  },
  DE: {
    primary: "#00539f",
    secondary: "#d8e8f8",
    accent: "#f7c948",
    background: "#edf5fc",
    surface: "#ffffff",
    border: "#b4cde8"
  },
  FL: {
    primary: "#bf0a30",
    secondary: "#f8dbe3",
    accent: "#1f5ea8",
    background: "#fff3f6",
    surface: "#ffffff",
    border: "#e8bcc7"
  },
  GA: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#b22234",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  HI: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#c8102e",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  ID: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f9a01b",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  IL: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#b22234",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  IN: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#f6c343",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  IA: {
    primary: "#0056a3",
    secondary: "#d8e9f9",
    accent: "#c8102e",
    background: "#edf5fc",
    surface: "#ffffff",
    border: "#b4cee9"
  },
  KS: {
    primary: "#00539f",
    secondary: "#d8e8f8",
    accent: "#f6c343",
    background: "#edf5fc",
    surface: "#ffffff",
    border: "#b4cde8"
  },
  KY: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f7c948",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  LA: {
    primary: "#24135f",
    secondary: "#ddd9f2",
    accent: "#f4b400",
    background: "#f1effa",
    surface: "#ffffff",
    border: "#c1b9e3"
  },
  ME: {
    primary: "#0a4f79",
    secondary: "#d7e9f3",
    accent: "#6b8e23",
    background: "#edf5f9",
    surface: "#ffffff",
    border: "#b2cddc"
  },
  MD: {
    primary: "#111111",
    secondary: "#e7e7e7",
    accent: "#c8102e",
    background: "#f5f5f5",
    surface: "#ffffff",
    border: "#cecece"
  },
  MA: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f2a900",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  MI: {
    primary: "#002b5c",
    secondary: "#d8e3f2",
    accent: "#f4b400",
    background: "#edf2f9",
    surface: "#ffffff",
    border: "#b3c4db"
  },
  MN: {
    primary: "#0056a3",
    secondary: "#d8e9f9",
    accent: "#78be20",
    background: "#edf5fc",
    surface: "#ffffff",
    border: "#b4cee9"
  },
  MS: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#b22234",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  MO: {
    primary: "#c8102e",
    secondary: "#f9dbe2",
    accent: "#003f87",
    background: "#fef3f6",
    surface: "#ffffff",
    border: "#ebbbc5"
  },
  MT: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f6c343",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  NE: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f9a01b",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  NV: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#c8102e",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  NH: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#c8102e",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  NJ: {
    primary: "#f2c75c",
    secondary: "#fbf2d8",
    accent: "#1f5ea8",
    background: "#fdf9ee",
    surface: "#ffffff",
    border: "#e8d8ab"
  },
  NM: {
    primary: "#f4c430",
    secondary: "#fbf3cf",
    accent: "#c8102e",
    background: "#fefbe9",
    surface: "#ffffff",
    border: "#eadca2"
  },
  NY: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#f4b400",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  NC: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#b22234",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  ND: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f6c343",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  OH: {
    primary: "#c8102e",
    secondary: "#f9dbe2",
    accent: "#003f87",
    background: "#fef3f6",
    surface: "#ffffff",
    border: "#ebbbc5"
  },
  OK: {
    primary: "#69b3e7",
    secondary: "#dff0fb",
    accent: "#8a6d3b",
    background: "#f0f8fe",
    surface: "#ffffff",
    border: "#bdd9ec"
  },
  OR: {
    primary: "#002f6c",
    secondary: "#d8e2f1",
    accent: "#f6c343",
    background: "#edf2f9",
    surface: "#ffffff",
    border: "#b3c3da"
  },
  PA: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f4b400",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  RI: {
    primary: "#f4c430",
    secondary: "#fbf3cf",
    accent: "#0a3161",
    background: "#fefbe9",
    surface: "#ffffff",
    border: "#eadca2"
  },
  SC: {
    primary: "#0074c8",
    secondary: "#d6ebfb",
    accent: "#ffffff",
    background: "#edf7ff",
    surface: "#ffffff",
    border: "#b1d2ec"
  },
  SD: {
    primary: "#0074c8",
    secondary: "#d6ebfb",
    accent: "#f6c343",
    background: "#edf7ff",
    surface: "#ffffff",
    border: "#b1d2ec"
  },
  TN: {
    primary: "#c8102e",
    secondary: "#f9dbe2",
    accent: "#003f87",
    background: "#fef3f6",
    surface: "#ffffff",
    border: "#ebbbc5"
  },
  TX: {
    primary: "#002868",
    secondary: "#d8e2f1",
    accent: "#bf0a30",
    background: "#edf2f9",
    surface: "#ffffff",
    border: "#b3c3da"
  },
  UT: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f99f1b",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  VT: {
    primary: "#154734",
    secondary: "#d6e8df",
    accent: "#f4b400",
    background: "#ecf5f0",
    surface: "#ffffff",
    border: "#b1ccbf"
  },
  VA: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#c8102e",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  WA: {
    primary: "#006241",
    secondary: "#d4e9e1",
    accent: "#a7a8aa",
    background: "#ebf5f1",
    surface: "#ffffff",
    border: "#aecbc0"
  },
  WV: {
    primary: "#0a3161",
    secondary: "#d9e5f3",
    accent: "#f4b400",
    background: "#edf3f9",
    surface: "#ffffff",
    border: "#b8c9dd"
  },
  WI: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f6c343",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  WY: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#ffffff",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  DC: {
    primary: "#c8102e",
    secondary: "#f9dbe2",
    accent: "#ffffff",
    background: "#fef3f6",
    surface: "#ffffff",
    border: "#ebbbc5"
  },
  AS: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#bd9458",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  GU: {
    primary: "#00539f",
    secondary: "#d8e8f8",
    accent: "#c8102e",
    background: "#edf5fc",
    surface: "#ffffff",
    border: "#b4cde8"
  },
  VI: {
    primary: "#003f87",
    secondary: "#d8e7f9",
    accent: "#f4b400",
    background: "#edf4fc",
    surface: "#ffffff",
    border: "#b4c9e8"
  },
  PR: {
    primary: "#0050a4",
    secondary: "#d8e8f8",
    accent: "#ef3340",
    background: "#edf5fc",
    surface: "#ffffff",
    border: "#b4cde8"
  }
};

export function getPaletteForState(stateCode: string): StatePalette {
  return STATE_PALETTES[stateCode] || DEFAULT_PALETTE;
}

function parseHexColor(color: string): [number, number, number] | null {
  const match = color.trim().match(HEX_COLOR_REGEX);
  if (!match) {
    return null;
  }

  const hex = match[1];
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

function toLinearSrgb(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: string): number | null {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return null;
  }

  const [r, g, b] = rgb.map(toLinearSrgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getReadableTextColor(
  backgroundColor: string,
  darkTextColor = "#111827",
  lightTextColor = "#ffffff"
): string {
  const luminance = getRelativeLuminance(backgroundColor);
  if (luminance === null) {
    return lightTextColor;
  }

  return luminance > 0.5 ? darkTextColor : lightTextColor;
}
