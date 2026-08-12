// Date entry helpers.
//
// AAMVA stores dates as eight bare digits — MMDDYYYY everywhere except the
// handful of versions that use YYYYMMDD — which is the one thing nobody types
// naturally. Everything here converts between that wire form and the shapes a
// human actually produces (08/11/2026, 2026-08-11, 8.11.26) without ever
// guessing at a value the user did not supply.

import { getEffectiveDateRules } from "./jurisdictionRules";

export type AamvaDateFormat = "MMDDYYYY" | "YYYYMMDD";

/**
 * Two-digit years are only accepted from separated input (`8/11/26`), never
 * from a bare digit run, and resolve against this window: anything at or below
 * (current year + PIVOT_LOOKAHEAD) is read as 20xx, everything else as 19xx.
 * An expiry ten years out still lands in the current century; a 1962 birth year
 * still lands in the last one.
 */
const PIVOT_LOOKAHEAD = 10;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/** Parts of a calendar date, already range-checked against a real calendar. */
interface DateParts {
  year: number;
  month: number;
  day: number;
}

function isRealDate({ year, month, day }: DateParts): boolean {
  if (year < 1800 || year > 2200) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function expandYear(raw: string, now: Date): number {
  const n = parseInt(raw, 10);
  if (raw.length === 4) return n;
  const currentTwoDigit = now.getUTCFullYear() % 100;
  const century = n <= currentTwoDigit + PIVOT_LOOKAHEAD ? 2000 : 1900;
  return century + n;
}

function toWire(parts: DateParts, format: AamvaDateFormat): string {
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  const yyyy = String(parts.year).padStart(4, "0");
  return format === "YYYYMMDD" ? yyyy + mm + dd : mm + dd + yyyy;
}

/** Splits an already-canonical eight-digit string into parts. */
export function parseAamvaDateParts(
  value: string,
  format: AamvaDateFormat = "MMDDYYYY"
): { year: number; month: number; day: number } | null {
  if (!/^\d{8}$/.test(value)) return null;
  const parts: DateParts =
    format === "YYYYMMDD"
      ? {
          year: parseInt(value.slice(0, 4), 10),
          month: parseInt(value.slice(4, 6), 10),
          day: parseInt(value.slice(6, 8), 10)
        }
      : {
          month: parseInt(value.slice(0, 2), 10),
          day: parseInt(value.slice(2, 4), 10),
          year: parseInt(value.slice(4, 8), 10)
        };
  return isRealDate(parts) ? parts : null;
}

/**
 * Converts whatever the user typed into the eight-digit wire form, or returns
 * null when the input is not a date this can resolve without guessing.
 *
 * Accepted shapes:
 *   - `08112026` / `20260811` — already canonical for the given format
 *   - `8/11/2026`, `08-11-2026`, `8.11.26` — separated, month-first
 *   - `2026-08-11` — separated and ISO-ordered (detected by the 4-digit lead,
 *     so it reads correctly even when the field's format is MMDDYYYY)
 *
 * Returns null rather than a best guess for impossible calendar dates
 * (`02/30/2026`) and for ambiguous fragments (`811`).
 */
export function normalizeDateInput(
  raw: string,
  format: AamvaDateFormat = "MMDDYYYY",
  now: Date = new Date()
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Bare digit runs: only the exact canonical width is accepted. Padding a
  // short run would invent digits the user never typed.
  if (/^\d+$/.test(trimmed)) {
    const parts = parseAamvaDateParts(trimmed, format);
    return parts ? toWire(parts, format) : null;
  }

  const chunks = trimmed.split(/[^\d]+/).filter(Boolean);
  if (chunks.length !== 3) return null;
  const [a = "", b = "", c = ""] = chunks;
  if (!/^\d{1,4}$/.test(a) || !/^\d{1,2}$/.test(b) || !/^\d{1,4}$/.test(c)) return null;

  // A four-digit leading chunk can only be a year, whatever the field's format.
  const isoOrdered = a.length === 4;
  const parts: DateParts = isoOrdered
    ? { year: parseInt(a, 10), month: parseInt(b, 10), day: parseInt(c, 10) }
    : { month: parseInt(a, 10), day: parseInt(b, 10), year: expandYear(c, now) };

  return isRealDate(parts) ? toWire(parts, format) : null;
}

/** "Aug 11, 2026" for a canonical value, or null when it is not a real date. */
export function describeAamvaDate(
  value: string,
  format: AamvaDateFormat = "MMDDYYYY"
): string | null {
  const parts = parseAamvaDateParts(value, format);
  if (!parts) return null;
  return `${MONTH_NAMES[parts.month - 1]} ${parts.day}, ${parts.year}`;
}

/** Whole years between two canonical dates, or null if either is unparseable. */
export function yearsBetween(
  fromValue: string,
  toValue: string,
  format: AamvaDateFormat = "MMDDYYYY"
): number | null {
  const from = parseAamvaDateParts(fromValue, format);
  const to = parseAamvaDateParts(toValue, format);
  if (!from || !to) return null;
  const years = to.year - from.year;
  const beforeAnniversary = to.month < from.month || (to.month === from.month && to.day < from.day);
  return beforeAnniversary ? years - 1 : years;
}

/** Today in the field's wire format. */
export function todayAamva(format: AamvaDateFormat = "MMDDYYYY", now: Date = new Date()): string {
  return toWire({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }, format);
}

/**
 * Shifts a canonical date by whole years, clamping Feb 29 to Feb 28 in a
 * non-leap target year rather than rolling into March.
 */
export function shiftYears(
  value: string,
  years: number,
  format: AamvaDateFormat = "MMDDYYYY"
): string | null {
  const parts = parseAamvaDateParts(value, format);
  if (!parts) return null;
  const year = parts.year + years;
  const daysInMonth = new Date(Date.UTC(year, parts.month, 0)).getUTCDate();
  const shifted: DateParts = { year, month: parts.month, day: Math.min(parts.day, daysInMonth) };
  return isRealDate(shifted) ? toWire(shifted, format) : null;
}

/** A one-click date offer shown beneath a date field. */
export interface DateChip {
  /** Button text. */
  label: string;
  /** Canonical value the chip applies. */
  value: string;
  /** Tooltip — says what the value resolves to. */
  title: string;
}

export interface DateChipOptions {
  format?: AamvaDateFormat;
  now?: Date;
  /**
   * Jurisdiction whose date rules bound the offers. Without it the expiry chips
   * are just "+4/+8 years", which in a state that caps validity at five will
   * hand the user a value its own validator immediately warns about.
   */
  stateCode?: string;
}

/** Validity terms offered by default, before the jurisdiction's rules apply. */
const DEFAULT_VALIDITY_YEARS = [4, 8];

/** Ages worth one click on a date of birth. */
const ADULT_AGES = [18, 21, 40];

/** Most offers to show on one field — beyond this the row stops being a shortcut. */
const MAX_CHIPS = 3;

/**
 * The handful of dates that are worth one click rather than mental arithmetic:
 * today's date for an issue date, terms the jurisdiction actually issues for an
 * expiry, and birth dates that put the holder at a plausible age *at issuance*.
 *
 * Everything is anchored to sibling field values where that is what the user
 * means — an expiry is "eight years after the issue date", not "eight years
 * from now", and "21 years ago" on a 2020 card would make the holder 15 when it
 * was issued, which is exactly the warning the chip is supposed to help avoid.
 */
export function getDateChips(
  code: string,
  fields: Record<string, string>,
  options: DateChipOptions = {}
): DateChip[] {
  const format = options.format ?? "MMDDYYYY";
  const now = options.now ?? new Date();
  const today = todayAamva(format, now);

  const chip = (label: string, value: string | null, context: string): DateChip[] =>
    value ? [{ label, value, title: `${context} — ${describeAamvaDate(value, format)}` }] : [];

  // The issue date anchors everything else, when it is legible.
  const issueDate = parseAamvaDateParts(fields.DBD ?? "", format) ? fields.DBD! : null;

  switch (code) {
    case "DBD":
      return chip("Today", today, "Issued today");

    case "DBA": {
      const anchor = issueDate ?? today;
      const anchoredTo = issueDate ? "from the issue date" : "from today";
      const rules = getEffectiveDateRules(options.stateCode ?? "");
      const max = rules.maxValidityYears;
      const min = rules.minValidityYears;

      // Offer the jurisdiction's own limit alongside the defaults, then drop
      // anything outside its window. A state that issues for exactly five years
      // should offer five, not four and eight.
      const terms = [...DEFAULT_VALIDITY_YEARS, ...(max === undefined ? [] : [max])]
        .filter(
          (years) => (max === undefined || years <= max) && (min === undefined || years >= min)
        )
        .filter((years, index, all) => all.indexOf(years) === index)
        .sort((a, b) => a - b)
        .slice(0, MAX_CHIPS);

      return terms.flatMap((years) =>
        chip(`+${years} yrs`, shiftYears(anchor, years, format), `${years} years ${anchoredTo}`)
      );
    }

    case "DBB": {
      // Ages are measured at issuance, which is what the cross-field check and
      // every jurisdiction's minimum-age rule actually look at.
      const anchor = issueDate ?? today;
      const at = issueDate ? "at issue" : "today";
      return ADULT_AGES.flatMap((age) =>
        chip(`${age} yrs ago`, shiftYears(anchor, -age, format), `Turns ${age} ${at}`)
      );
    }

    case "DDB":
      // A card revision never postdates the issue date; matching it is always
      // valid, which is more than the random generator can promise.
      return issueDate ? chip("Match issue", issueDate, "Same as the issue date") : [];

    default:
      return [];
  }
}
