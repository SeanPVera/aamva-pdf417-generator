// Purely decorative: each jurisdiction's (semi-)official state animal, used by
// the celebratory confetti burst when a barcode first generates. Zero bearing
// on AAMVA output — it just makes the app smile.

export interface StateCritter {
  emoji: string;
  name: string;
}

export const DEFAULT_CRITTER: StateCritter = { emoji: "🦅", name: "Bald Eagle" };

export const STATE_CRITTERS: Record<string, StateCritter> = {
  AL: { emoji: "🐊", name: "Yellowhammer" },
  AK: { emoji: "🐻‍❄️", name: "Polar Bear" },
  AZ: { emoji: "🌵", name: "Cactus Wren" },
  AR: { emoji: "🦌", name: "White-tailed Deer" },
  CA: { emoji: "🐻", name: "Grizzly Bear" },
  CO: { emoji: "🦬", name: "Bighorn Sheep" },
  CT: { emoji: "🐋", name: "Sperm Whale" },
  DE: { emoji: "🐞", name: "Ladybug" },
  DC: { emoji: "🦅", name: "Wood Thrush" },
  FL: { emoji: "🐊", name: "Florida Panther" },
  GA: { emoji: "🦌", name: "White-tailed Deer" },
  HI: { emoji: "🦭", name: "Monk Seal" },
  ID: { emoji: "🐎", name: "Appaloosa Horse" },
  IL: { emoji: "🦌", name: "White-tailed Deer" },
  IN: { emoji: "🦝", name: "Hoosier Critter" },
  IA: { emoji: "🦅", name: "Eastern Goldfinch" },
  KS: { emoji: "🦬", name: "American Bison" },
  KY: { emoji: "🐿️", name: "Gray Squirrel" },
  LA: { emoji: "🐻", name: "Black Bear" },
  ME: { emoji: "🦞", name: "Moose & Lobster" },
  MD: { emoji: "🦀", name: "Blue Crab" },
  MA: { emoji: "🐴", name: "Morgan Horse" },
  MI: { emoji: "🦌", name: "White-tailed Deer" },
  MN: { emoji: "🦆", name: "Common Loon" },
  MS: { emoji: "🐬", name: "Bottlenose Dolphin" },
  MO: { emoji: "🐴", name: "Missouri Mule" },
  MT: { emoji: "🐻", name: "Grizzly Bear" },
  NE: { emoji: "🦌", name: "White-tailed Deer" },
  NV: { emoji: "🐏", name: "Desert Bighorn Sheep" },
  NH: { emoji: "🦌", name: "White-tailed Deer" },
  NJ: { emoji: "🐴", name: "Horse" },
  NM: { emoji: "🐻", name: "Black Bear" },
  NY: { emoji: "🦫", name: "Beaver" },
  NC: { emoji: "🐿️", name: "Gray Squirrel" },
  ND: { emoji: "🐎", name: "Nokota Horse" },
  OH: { emoji: "🦌", name: "White-tailed Deer" },
  OK: { emoji: "🦬", name: "American Bison" },
  OR: { emoji: "🦫", name: "Beaver" },
  PA: { emoji: "🦌", name: "White-tailed Deer" },
  RI: { emoji: "🐔", name: "Red Chicken" },
  SC: { emoji: "🦌", name: "White-tailed Deer" },
  SD: { emoji: "🐇", name: "Coyote" },
  TN: { emoji: "🦝", name: "Raccoon" },
  TX: { emoji: "🦇", name: "Mexican Free-tailed Bat" },
  UT: { emoji: "🦬", name: "Rocky Mountain Elk" },
  VT: { emoji: "🐄", name: "Morgan Horse" },
  VA: { emoji: "🐕", name: "Foxhound" },
  WA: { emoji: "🐸", name: "Olympic Marmot" },
  WV: { emoji: "🐻", name: "Black Bear" },
  WI: { emoji: "🦡", name: "Badger" },
  WY: { emoji: "🦬", name: "American Bison" },
  // Territories
  PR: { emoji: "🐸", name: "Coquí" },
  GU: { emoji: "🦌", name: "Mariana Fruit Bat" },
  VI: { emoji: "🐦", name: "Bananaquit" },
  AS: { emoji: "🦇", name: "Flying Fox" },
  MP: { emoji: "🕊️", name: "Mariana Fruit Dove" }
};

export function getStateCritter(code: string): StateCritter {
  return STATE_CRITTERS[code] ?? DEFAULT_CRITTER;
}
