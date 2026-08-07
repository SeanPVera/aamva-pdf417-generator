// "Employee of the Month" — decorative achievements awarded for things the app
// can already observe. Everything here is derived from counters, never from
// field values, so nothing personal is ever stored or displayed.

import { AAMVA_STATES } from "./states";

export interface BadgeStats {
  /** Distinct jurisdiction codes the user has selected. */
  visitedStates: string[];
  /** Successful barcode generations. */
  generated: number;
  /** Generations that had zero validation issues. */
  cleanGenerated: number;
  /** True once a generation succeeded on the first try of a session. */
  firstTryClean: boolean;
  /** Undo invocations this session. */
  undos: number;
  /** Redo invocations this session. */
  redos: number;
  /** Barcodes exported (PNG/SVG/print/copy). */
  exports: number;
  /** Batch rows successfully processed, cumulative. */
  batchRows: number;
  /** True once a barcode generated between midnight and 4am local time. */
  nightShift: boolean;
}

export interface BadgeDef {
  id: string;
  label: string;
  blurb: string;
  emoji: string;
  earned: (s: BadgeStats) => boolean;
  /** Optional progress readout, e.g. "12/55". */
  progress?: (s: BadgeStats) => string | undefined;
}

/** Derived from the registry so the badge can never drift from reality. */
export const TOTAL_JURISDICTIONS = Object.keys(AAMVA_STATES).length;

export const BADGES: BadgeDef[] = [
  {
    id: "tour-of-duty",
    label: "Tour of Duty",
    blurb: "Selected every jurisdiction at least once.",
    emoji: "🗺️",
    earned: (s) => s.visitedStates.length >= TOTAL_JURISDICTIONS,
    progress: (s) => `${s.visitedStates.length}/${TOTAL_JURISDICTIONS}`
  },
  {
    id: "clean-record",
    label: "Clean Record",
    blurb: "Generated a barcode with zero validation issues.",
    emoji: "✨",
    earned: (s) => s.cleanGenerated > 0
  },
  {
    id: "first-try",
    label: "No Notes",
    blurb: "Cleared validation on the very first generate of a session.",
    emoji: "🎯",
    earned: (s) => s.firstTryClean
  },
  {
    id: "clean-sweep",
    label: "Clean Sweep",
    blurb: "Twenty undos and not a single redo. Commitment.",
    emoji: "🧹",
    earned: (s) => s.undos >= 20 && s.redos === 0
  },
  {
    id: "night-shift",
    label: "Night Shift",
    blurb: "Generated a barcode between midnight and 4 a.m.",
    emoji: "🌙",
    earned: (s) => s.nightShift
  },
  {
    id: "window-clerk",
    label: "Window Clerk",
    blurb: "Fifty barcodes generated. The line never ends.",
    emoji: "🪟",
    earned: (s) => s.generated >= 50,
    progress: (s) => (s.generated >= 50 ? undefined : `${s.generated}/50`)
  },
  {
    id: "mail-room",
    label: "Mail Room",
    blurb: "Processed 100 rows through batch.",
    emoji: "📦",
    earned: (s) => s.batchRows >= 100,
    progress: (s) => (s.batchRows >= 100 ? undefined : `${s.batchRows}/100`)
  },
  {
    id: "paper-trail",
    label: "Paper Trail",
    blurb: "Exported twenty-five barcodes.",
    emoji: "🧾",
    earned: (s) => s.exports >= 25,
    progress: (s) => (s.exports >= 25 ? undefined : `${s.exports}/25`)
  }
];

export const EMPTY_BADGE_STATS: BadgeStats = {
  visitedStates: [],
  generated: 0,
  cleanGenerated: 0,
  firstTryClean: false,
  undos: 0,
  redos: 0,
  exports: 0,
  batchRows: 0,
  nightShift: false
};

export function earnedBadges(stats: BadgeStats): BadgeDef[] {
  return BADGES.filter((b) => b.earned(stats));
}

/** The badge shown on the plaque: the most recently attainable earned one. */
export function featuredBadge(stats: BadgeStats): BadgeDef | undefined {
  const earned = earnedBadges(stats);
  return earned[earned.length - 1];
}
