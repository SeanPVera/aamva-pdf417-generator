import { JURISDICTION_RULE_PACKS } from "./jurisdictionRules";

export interface PrivilegeChip {
  label: string;
  value: string;
  title: string;
}

export interface PrivilegeDirectory {
  state: string;
  /** Non-CDL automobile class this DMV prints on a regular DL (C, D, E, …). */
  regularClass: string;
  classes: PrivilegeChip[];
  restrictions: PrivilegeChip[];
  endorsements: PrivilegeChip[];
}

const CDL_CLASS = new Set(["A", "B"]);
const MOTO_CLASS = new Set(["M", "M1", "M2", "MJ"]);
const JUNIOR_CLASS = new Set(["DJ", "MJ"]);
const TIE_BREAK = ["D", "E", "C", "F", "G", "O", "R", "3"];

/** Age-table keys that are not valid DCA values (max 6). */
const CLASS_VALUE_ALIASES: Record<string, string> = {
  Operator: "O"
};

const CLASS_A: PrivilegeChip = {
  label: "A CDL combo",
  value: "A",
  title:
    "Class A — combination vehicles (tractor-trailer) over 26,001 lbs with a trailer over 10,000 lbs. CDL. Typical minimum age 21."
};
const CLASS_B: PrivilegeChip = {
  label: "B CDL heavy",
  value: "B",
  title:
    "Class B — a single vehicle over 26,001 lbs (bus, dump truck, box truck). CDL. Typical minimum age 21."
};
const CLASS_M: PrivilegeChip = {
  label: "M motorcycle",
  value: "M",
  title:
    "Class M — motorcycle. Combine with a car class as AM, CM, DM, etc. if the card grants both."
};
const CLASS_NONE: PrivilegeChip = {
  label: "NONE",
  value: "NONE",
  title:
    "No driving privilege — identification card. Encode NONE, not a blank, when the field is required."
};

const KNOWN_CLASS_COPY: Record<string, PrivilegeChip> = {
  A: CLASS_A,
  B: CLASS_B,
  C: {
    label: "C regular",
    value: "C",
    title:
      "Class C — passenger cars and light trucks. Regular automobile class in this jurisdiction."
  },
  D: {
    label: "D regular",
    value: "D",
    title:
      "Class D — passenger cars and light trucks. Regular automobile class in this jurisdiction."
  },
  E: {
    label: "E regular",
    value: "E",
    title: "Class E — passenger cars / operator. Regular automobile class in this jurisdiction."
  },
  F: {
    label: "F regular",
    value: "F",
    title: "Class F — operator / passenger cars in this jurisdiction."
  },
  G: {
    label: "G regular",
    value: "G",
    title: "Class G — operator in this jurisdiction."
  },
  O: {
    label: "O operator",
    value: "O",
    title: "Class O — operator (Nebraska, Michigan, and similar)."
  },
  R: {
    label: "R regular",
    value: "R",
    title: "Class R — regular operator in this jurisdiction (Colorado and similar)."
  },
  "3": {
    label: "3 regular",
    value: "3",
    title: "Class 3 — regular operator in this jurisdiction (Hawaii)."
  },
  M: CLASS_M,
  M1: {
    label: "M1 2-wheel",
    value: "M1",
    title: "M1 — two-wheel motorcycle. Distinct from M2 (moped / motor-driven cycle)."
  },
  M2: {
    label: "M2 moped",
    value: "M2",
    title: "M2 — motor-driven cycle or moped."
  },
  DJ: {
    label: "DJ junior",
    value: "DJ",
    title: "Junior operator. Regular adult operator is a different class in this jurisdiction."
  },
  MJ: {
    label: "MJ junior moto",
    value: "MJ",
    title: "Junior motorcycle."
  }
};

/**
 * AAMVA D20 driver-license restriction codes — what DCB actually encodes on
 * the barcode. Face-card numbers (PA 1–9, NC 0–80) are a different table.
 */
const AAMVA_D20_RESTRICTIONS: PrivilegeChip[] = [
  {
    label: "NONE",
    value: "NONE",
    title: "No restrictions. Encode NONE when the field is required and the driver has none."
  },
  {
    label: "B lenses",
    value: "B",
    title: "AAMVA D20: corrective lenses must be worn."
  },
  {
    label: "C mechanical",
    value: "C",
    title: "AAMVA D20: mechanical aid (hand controls, spinner knob, adaptive devices)."
  },
  {
    label: "D prosthetic",
    value: "D",
    title: "AAMVA D20: prosthetic aid."
  },
  {
    label: "E automatic",
    value: "E",
    title: "AAMVA D20: no manual transmission / automatic only (CDL skills test in an automatic)."
  },
  {
    label: "F outside mirror",
    value: "F",
    title: "AAMVA D20: outside mirror required."
  },
  {
    label: "G daylight",
    value: "G",
    title: "AAMVA D20: limited to daylight only."
  },
  {
    label: "H employment",
    value: "H",
    title: "AAMVA D20: limited to employment."
  },
  {
    label: "I limited other",
    value: "I",
    title: "AAMVA D20: limited — other. Jurisdiction-defined; see the face or J explanation."
  },
  {
    label: "J other",
    value: "J",
    title: "AAMVA D20: other. When used, a restriction explanation describes it."
  },
  {
    label: "K intrastate",
    value: "K",
    title: "AAMVA D20: CDL intrastate only — may not operate a CMV across state lines."
  },
  {
    label: "L no air brake",
    value: "L",
    title: "AAMVA D20: no air-brake equipped CMV."
  },
  {
    label: "M no Class A bus",
    value: "M",
    title: "AAMVA D20: no Class A passenger vehicle (passenger skills test in a Class B)."
  },
  {
    label: "N no A/B bus",
    value: "N",
    title: "AAMVA D20: no Class A or B passenger vehicle (passenger skills test in a Class C)."
  },
  {
    label: "O no tractor-trailer",
    value: "O",
    title: "AAMVA D20: no tractor-trailer CMV (skills test not in a truck tractor-semitrailer)."
  },
  {
    label: "P no CMV passengers",
    value: "P",
    title: "AAMVA D20: no passengers in a CMV bus (typical on a CLP with a P endorsement)."
  },
  {
    label: "T interlock",
    value: "T",
    title: "AAMVA D20: breath alcohol ignition interlock device."
  },
  {
    label: "V medical variance",
    value: "V",
    title: "AAMVA D20: CDL medical variance (SPE / exemption)."
  },
  {
    label: "W farm waiver",
    value: "W",
    title: "AAMVA D20: farm waiver."
  },
  {
    label: "X no tank cargo",
    value: "X",
    title: "AAMVA D20: no cargo in a CMV tank vehicle (typical on a CLP with an N endorsement)."
  },
  {
    label: "Z no full air",
    value: "Z",
    title: "AAMVA D20: no full air-brake equipped CMV."
  }
];

const NATIONAL_ENDORSEMENTS: PrivilegeChip[] = [
  {
    label: "NONE",
    value: "NONE",
    title: "No endorsements. Encode NONE when the field is required and the driver has none."
  },
  {
    label: "H hazmat",
    value: "H",
    title: "Hazardous materials endorsement. Requires TSA threat assessment."
  },
  { label: "N tank", value: "N", title: "Tank vehicle endorsement." },
  { label: "P passenger", value: "P", title: "Passenger endorsement (bus)." },
  { label: "S school", value: "S", title: "School bus endorsement." },
  { label: "T doubles", value: "T", title: "Doubles / triples trailer endorsement." },
  {
    label: "X tank+hazmat",
    value: "X",
    title: "Combination tank and hazardous materials endorsement."
  }
];

function encodeClass(raw: string): string {
  const aliased = CLASS_VALUE_ALIASES[raw] ?? raw;
  return aliased.length > 6 ? aliased.slice(0, 6) : aliased;
}

function chipForClass(code: string, minAge?: number): PrivilegeChip {
  const encoded = encodeClass(code);
  const known = KNOWN_CLASS_COPY[encoded] ?? KNOWN_CLASS_COPY[code];
  if (known) {
    return minAge != null ? { ...known, title: `${known.title} Minimum age ${minAge}.` } : known;
  }
  return {
    label: `${encoded} class`,
    value: encoded,
    title: `Class ${encoded}${minAge != null ? ` — minimum age ${minAge}` : ""} in this jurisdiction.`
  };
}

/**
 * Regular (non-CDL, non-motorcycle) class letter this jurisdiction puts on a
 * standard automobile DL. Read off `classMinimumAges` already in the rule pack.
 */
export function regularClassFor(state: string): string {
  const ages = JURISDICTION_RULE_PACKS[state]?.classMinimumAges ?? {};
  const keys = Object.keys(ages).filter(
    (k) => !CDL_CLASS.has(k) && !MOTO_CLASS.has(k) && !JUNIOR_CLASS.has(k)
  );
  if (keys.length === 0) return "D";
  const minAge = Math.min(...keys.map((k) => ages[k] ?? 99));
  const youngest = keys.filter((k) => (ages[k] ?? 99) === minAge);
  const preferred = TIE_BREAK.find(
    (k) => youngest.includes(encodeClass(k)) || youngest.includes(k)
  );
  return encodeClass(preferred ?? youngest[0] ?? "D");
}

function classChipsFor(state: string, regular: string): PrivilegeChip[] {
  const ages = JURISDICTION_RULE_PACKS[state]?.classMinimumAges ?? {};
  const seen = new Set<string>();
  const out: PrivilegeChip[] = [];
  const push = (chip: PrivilegeChip) => {
    if (seen.has(chip.value)) return;
    seen.add(chip.value);
    out.push(chip);
  };

  push(CLASS_A);
  push(CLASS_B);
  push(chipForClass(regular, ages[regular]));
  push(CLASS_M);

  for (const [raw, age] of Object.entries(ages)) {
    const encoded = encodeClass(raw);
    if (encoded === regular) continue;
    if (CDL_CLASS.has(encoded) || encoded === "M") continue;
    push(chipForClass(raw, age));
  }

  push(CLASS_NONE);
  return out;
}

export function getPrivilegeDirectory(state: string): PrivilegeDirectory {
  const regularClass = regularClassFor(state);
  return {
    state,
    regularClass,
    classes: classChipsFor(state, regularClass),
    restrictions: AAMVA_D20_RESTRICTIONS,
    endorsements: NATIONAL_ENDORSEMENTS
  };
}

/** Safe starting values — not PII — so truncation/country/class aren't blank. */

/** True when the current class is still whatever we seeded, not a user pick. */
export function isDefaultClass(
  value: string | undefined,
  state: string,
  subfileType: "DL" | "ID"
): boolean {
  if (!value || !value.trim()) return true;
  if (value === "NONE" && subfileType === "ID") return true;
  return value === regularClassFor(state);
}
