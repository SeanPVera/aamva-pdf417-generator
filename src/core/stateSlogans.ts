// Purely decorative: the motto or plate slogan each jurisdiction is known for,
// used by the license-plate frame around the barcode preview. Zero bearing on
// AAMVA output.

export interface StatePlate {
  /** The line that runs under the barcode, as it appears on the plate. */
  slogan: string;
  /** Plate name line — usually the jurisdiction name, occasionally stylized. */
  title: string;
}

export const DEFAULT_PLATE: StatePlate = { slogan: "United States", title: "USA" };

export const STATE_PLATES: Record<string, StatePlate> = {
  AL: { title: "Alabama", slogan: "Sweet Home Alabama" },
  AK: { title: "Alaska", slogan: "The Last Frontier" },
  AZ: { title: "Arizona", slogan: "Grand Canyon State" },
  AR: { title: "Arkansas", slogan: "The Natural State" },
  CA: { title: "California", slogan: "The Golden State" },
  CO: { title: "Colorado", slogan: "Colorful Colorado" },
  CT: { title: "Connecticut", slogan: "Constitution State" },
  DE: { title: "Delaware", slogan: "The First State" },
  DC: { title: "District of Columbia", slogan: "Taxation Without Representation" },
  FL: { title: "Florida", slogan: "The Sunshine State" },
  GA: { title: "Georgia", slogan: "Peach State" },
  HI: { title: "Hawaii", slogan: "Aloha State" },
  ID: { title: "Idaho", slogan: "Famous Potatoes" },
  IL: { title: "Illinois", slogan: "Land of Lincoln" },
  IN: { title: "Indiana", slogan: "Crossroads of America" },
  IA: { title: "Iowa", slogan: "The Hawkeye State" },
  KS: { title: "Kansas", slogan: "Ad Astra Per Aspera" },
  KY: { title: "Kentucky", slogan: "Unbridled Spirit" },
  LA: { title: "Louisiana", slogan: "Sportsman's Paradise" },
  ME: { title: "Maine", slogan: "Vacationland" },
  MD: { title: "Maryland", slogan: "The Old Line State" },
  MA: { title: "Massachusetts", slogan: "The Spirit of America" },
  MI: { title: "Michigan", slogan: "Pure Michigan" },
  MN: { title: "Minnesota", slogan: "10,000 Lakes" },
  MS: { title: "Mississippi", slogan: "Birthplace of America's Music" },
  MO: { title: "Missouri", slogan: "Show-Me State" },
  MT: { title: "Montana", slogan: "Big Sky Country" },
  NE: { title: "Nebraska", slogan: "The Good Life" },
  NV: { title: "Nevada", slogan: "The Silver State" },
  NH: { title: "New Hampshire", slogan: "Live Free or Die" },
  NJ: { title: "New Jersey", slogan: "Garden State" },
  NM: { title: "New Mexico", slogan: "Land of Enchantment" },
  NY: { title: "New York", slogan: "The Empire State" },
  NC: { title: "North Carolina", slogan: "First in Flight" },
  ND: { title: "North Dakota", slogan: "Legendary" },
  OH: { title: "Ohio", slogan: "Birthplace of Aviation" },
  OK: { title: "Oklahoma", slogan: "Native America" },
  OR: { title: "Oregon", slogan: "Pacific Wonderland" },
  PA: { title: "Pennsylvania", slogan: "Keystone State" },
  RI: { title: "Rhode Island", slogan: "The Ocean State" },
  SC: { title: "South Carolina", slogan: "While I Breathe, I Hope" },
  SD: { title: "South Dakota", slogan: "Great Faces. Great Places." },
  TN: { title: "Tennessee", slogan: "The Volunteer State" },
  TX: { title: "Texas", slogan: "The Lone Star State" },
  UT: { title: "Utah", slogan: "Life Elevated" },
  VT: { title: "Vermont", slogan: "Green Mountain State" },
  VA: { title: "Virginia", slogan: "Virginia is for Lovers" },
  WA: { title: "Washington", slogan: "Evergreen State" },
  WV: { title: "West Virginia", slogan: "Wild and Wonderful" },
  WI: { title: "Wisconsin", slogan: "America's Dairyland" },
  WY: { title: "Wyoming", slogan: "Forever West" },
  // Territories
  PR: { title: "Puerto Rico", slogan: "Isla del Encanto" },
  GU: { title: "Guam", slogan: "Tånó y Chamorro" },
  VI: { title: "U.S. Virgin Islands", slogan: "American Paradise" },
  AS: { title: "American Samoa", slogan: "Motu o Fiafiaga" },
  MP: { title: "Northern Marianas", slogan: "Hafa Adai" }
};

export function getStatePlate(code: string): StatePlate {
  return STATE_PLATES[code] ?? DEFAULT_PLATE;
}
