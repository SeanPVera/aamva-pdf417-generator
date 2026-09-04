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

const REGULAR_CLASS_COPY: Record<string, PrivilegeChip> = {
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
    title: "Class O — operator (Nebraska and similar)."
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
  }
};

const NATIONAL_RESTRICTIONS: PrivilegeChip[] = [
  {
    label: "NONE",
    value: "NONE",
    title: "No restrictions. Encode NONE when the field is required and the driver has none."
  },
  {
    label: "B lenses",
    value: "B",
    title: "Corrective lenses required. Common passenger-car restriction."
  },
  {
    label: "C mechanical",
    value: "C",
    title: "Mechanical aid required (adapted vehicle)."
  },
  {
    label: "D prosthetic",
    value: "D",
    title: "Prosthetic aid required."
  },
  {
    label: "E automatic",
    value: "E",
    title: "Automatic transmission only (CDL: no manual transmission CMV)."
  },
  {
    label: "K intrastate",
    value: "K",
    title: "Intrastate only — may not operate a CMV across state lines."
  },
  {
    label: "L no air brake",
    value: "L",
    title: "No air-brake equipped CMV."
  },
  {
    label: "Z no full air",
    value: "Z",
    title: "No full air-brake equipped CMV."
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

/** Extra class chips a jurisdiction prints beyond A/B/regular/M. */
const EXTRA_CLASSES: Record<string, PrivilegeChip[]> = {
  CA: [
    {
      label: "M1 2-wheel",
      value: "M1",
      title: "California M1 — two-wheel motorcycle. Distinct from M2 (motor-driven cycle / moped)."
    },
    {
      label: "M2 moped",
      value: "M2",
      title: "California M2 — motor-driven cycle or moped."
    }
  ],
  NY: [
    {
      label: "DJ junior",
      value: "DJ",
      title: "New York junior operator. Minimum age 16. Regular adult operator is D."
    }
  ]
};

/** Extra restriction letters a DMV uses on top of the national CDL set. */
const EXTRA_RESTRICTIONS: Record<string, PrivilegeChip[]> = {
  CA: [
    {
      label: "F daylight",
      value: "F",
      title: "California: daylight driving only."
    },
    {
      label: "G extras",
      value: "G",
      title: "California: limited to extra controls / outside mirrors as printed on the face."
    }
  ],
  NY: [
    {
      label: "A 3-wheel",
      value: "A",
      title: "New York: motorcycle with sidecar / three-wheel only (confirm on the face)."
    }
  ],
  TX: [
    {
      label: "P interlock",
      value: "P",
      title: "Texas: ignition interlock required."
    }
  ],
  FL: [
    {
      label: "A daytime",
      value: "A",
      title: "Florida: daytime driving only."
    }
  ]
};

/**
 * Regular (non-CDL, non-motorcycle) class letter this jurisdiction puts on a
 * standard automobile DL. Read off `classMinimumAges` already in the rule pack
 * — that table is the source of truth we already maintain per DMV.
 */
export function regularClassFor(state: string): string {
  const ages = JURISDICTION_RULE_PACKS[state]?.classMinimumAges ?? {};
  const keys = Object.keys(ages).filter(
    (k) => !CDL_CLASS.has(k) && !MOTO_CLASS.has(k) && !JUNIOR_CLASS.has(k)
  );
  if (keys.length === 0) return "D";
  const minAge = Math.min(...keys.map((k) => ages[k] ?? 99));
  const youngest = keys.filter((k) => (ages[k] ?? 99) === minAge);
  const preferred = TIE_BREAK.find((k) => youngest.includes(k));
  return preferred ?? youngest[0] ?? "D";
}

function classChipsFor(state: string, regular: string): PrivilegeChip[] {
  const regularChip =
    REGULAR_CLASS_COPY[regular] ??
    ({
      label: `${regular} regular`,
      value: regular,
      title: `Class ${regular} — regular operator class in this jurisdiction.`
    } satisfies PrivilegeChip);
  const extras = EXTRA_CLASSES[state] ?? [];
  const seen = new Set(["A", "B", regular, "M", "NONE"]);
  const extra = extras.filter((c) => {
    if (seen.has(c.value)) return false;
    seen.add(c.value);
    return true;
  });
  return [CLASS_A, CLASS_B, regularChip, CLASS_M, ...extra, CLASS_NONE];
}

function mergeChips(base: PrivilegeChip[], extra: PrivilegeChip[] | undefined): PrivilegeChip[] {
  if (!extra?.length) return base;
  const seen = new Set(base.map((c) => c.value));
  const none = base.filter((c) => c.value === "NONE");
  const rest = base.filter((c) => c.value !== "NONE");
  for (const chip of extra) {
    if (seen.has(chip.value)) continue;
    seen.add(chip.value);
    rest.push(chip);
  }
  return [...rest, ...none];
}

export function getPrivilegeDirectory(state: string): PrivilegeDirectory {
  const regularClass = regularClassFor(state);
  return {
    state,
    regularClass,
    classes: classChipsFor(state, regularClass),
    restrictions: mergeChips(NATIONAL_RESTRICTIONS, EXTRA_RESTRICTIONS[state]),
    endorsements: NATIONAL_ENDORSEMENTS
  };
}

/** Safe starting values — not PII — so truncation/country/class aren't blank. */
export function seededFields(state: string, subfileType: "DL" | "ID"): Record<string, string> {
  const dir = getPrivilegeDirectory(state);
  return {
    DDE: "N",
    DDF: "N",
    DDG: "N",
    DCG: "USA",
    DCA: subfileType === "ID" ? "NONE" : dir.regularClass,
    DCB: "NONE",
    DCD: "NONE"
  };
}

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
