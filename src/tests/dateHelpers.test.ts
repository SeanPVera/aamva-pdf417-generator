import { describe, it, expect } from "vitest";
import {
  describeAamvaDate,
  getDateChips,
  normalizeDateInput,
  parseAamvaDateParts,
  shiftYears,
  todayAamva,
  yearsBetween
} from "../core/dateHelpers";

// Fixed "now" so the two-digit-year pivot is a property of the code under test
// rather than of the day the suite happens to run.
const NOW = new Date(Date.UTC(2026, 7, 11));

describe("normalizeDateInput", () => {
  it("passes an already-canonical MMDDYYYY value straight through", () => {
    expect(normalizeDateInput("08112026", "MMDDYYYY", NOW)).toBe("08112026");
  });

  it("accepts slashes, dashes, dots, and single-digit month/day", () => {
    for (const input of ["8/11/2026", "08-11-2026", "8.11.2026", "08 11 2026"]) {
      expect(normalizeDateInput(input, "MMDDYYYY", NOW)).toBe("08112026");
    }
  });

  it("reads a four-digit leading chunk as ISO regardless of the field format", () => {
    expect(normalizeDateInput("2026-08-11", "MMDDYYYY", NOW)).toBe("08112026");
    expect(normalizeDateInput("2026-08-11", "YYYYMMDD", NOW)).toBe("20260811");
  });

  it("emits the field's own format", () => {
    expect(normalizeDateInput("8/11/2026", "YYYYMMDD", NOW)).toBe("20260811");
  });

  // A licence issued today expires within a decade; a birth date does not.
  it("resolves two-digit years against the pivot window", () => {
    expect(normalizeDateInput("8/11/26", "MMDDYYYY", NOW)).toBe("08112026");
    expect(normalizeDateInput("8/11/36", "MMDDYYYY", NOW)).toBe("08112036");
    expect(normalizeDateInput("8/11/37", "MMDDYYYY", NOW)).toBe("08111937");
    expect(normalizeDateInput("8/11/62", "MMDDYYYY", NOW)).toBe("08111962");
  });

  // Padding a short run would invent digits the user never typed.
  it("refuses to expand a bare digit run of the wrong width", () => {
    expect(normalizeDateInput("811", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("81126", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("081120260", "MMDDYYYY", NOW)).toBeNull();
  });

  it("rejects dates the calendar does not have", () => {
    expect(normalizeDateInput("02/30/2026", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("13/01/2026", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("02291900", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("02292024", "MMDDYYYY", NOW)).toBe("02292024");
  });

  it("returns null for input that is not a date at all", () => {
    expect(normalizeDateInput("", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("   ", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("tomorrow", "MMDDYYYY", NOW)).toBeNull();
    expect(normalizeDateInput("8/11", "MMDDYYYY", NOW)).toBeNull();
  });
});

describe("parseAamvaDateParts", () => {
  it("splits both wire formats", () => {
    expect(parseAamvaDateParts("08112026", "MMDDYYYY")).toEqual({
      year: 2026,
      month: 8,
      day: 11
    });
    expect(parseAamvaDateParts("20260811", "YYYYMMDD")).toEqual({
      year: 2026,
      month: 8,
      day: 11
    });
  });

  it("rejects anything that is not eight digits or not a real date", () => {
    expect(parseAamvaDateParts("2026-08-11")).toBeNull();
    expect(parseAamvaDateParts("02302026")).toBeNull();
  });
});

describe("describeAamvaDate", () => {
  it("renders a human-readable date", () => {
    expect(describeAamvaDate("08112026")).toBe("Aug 11, 2026");
    expect(describeAamvaDate("20260101", "YYYYMMDD")).toBe("Jan 1, 2026");
  });

  it("returns null when there is nothing to describe", () => {
    expect(describeAamvaDate("")).toBeNull();
    expect(describeAamvaDate("99999999")).toBeNull();
  });
});

describe("yearsBetween", () => {
  it("counts whole years only", () => {
    expect(yearsBetween("08111990", "08112026")).toBe(36);
    expect(yearsBetween("08121990", "08112026")).toBe(35);
    expect(yearsBetween("01011990", "12311990")).toBe(0);
  });

  it("returns null when either end is unparseable", () => {
    expect(yearsBetween("", "08112026")).toBeNull();
    expect(yearsBetween("08112026", "nope")).toBeNull();
  });
});

describe("todayAamva", () => {
  it("formats the supplied date in the requested wire format", () => {
    const now = new Date(2026, 7, 11);
    expect(todayAamva("MMDDYYYY", now)).toBe("08112026");
    expect(todayAamva("YYYYMMDD", now)).toBe("20260811");
  });
});

describe("getDateChips", () => {
  // getDateChips builds from todayAamva, which reads local calendar parts.
  const LOCAL_NOW = new Date(2026, 7, 11);

  it("offers today for the issue date", () => {
    const chips = getDateChips("DBD", {}, { now: LOCAL_NOW });
    expect(chips).toHaveLength(1);
    expect(chips[0]!.value).toBe("08112026");
    expect(chips[0]!.title).toContain("Aug 11, 2026");
  });

  // The whole point of the expiry chips: "+8 years" means from the issue date,
  // not from whenever the form happens to be open.
  it("anchors the expiry chips to the issue date when there is one", () => {
    const chips = getDateChips("DBA", { DBD: "01012024" }, { now: LOCAL_NOW });
    expect(chips.map((c) => c.value)).toEqual(["01012028", "01012032"]);
    expect(chips[0]!.title).toContain("from the issue date");
  });

  it("falls back to today when the issue date is missing or unparseable", () => {
    expect(getDateChips("DBA", {}, { now: LOCAL_NOW }).map((c) => c.value)).toEqual([
      "08112030",
      "08112034"
    ]);
    expect(getDateChips("DBA", { DBD: "8/1/24" }, { now: LOCAL_NOW })[0]!.title).toContain(
      "from today"
    );
  });

  // CA caps validity at five years, so offering "+8 yrs" hands the user a value
  // its own validator immediately warns about — and never offers the term the
  // state actually issues.
  it("bounds the expiry chips by the jurisdiction's validity window", () => {
    const chips = getDateChips("DBA", { DBD: "01012024" }, { now: LOCAL_NOW, stateCode: "CA" });
    const years = chips.map((c) => c.label);
    expect(years).toContain("+5 yrs");
    expect(years).not.toContain("+8 yrs");
    expect(chips.every((c) => c.value <= "01012029")).toBe(true);
  });

  it("keeps the default terms where the jurisdiction does not narrow them", () => {
    const chips = getDateChips("DBA", { DBD: "01012024" }, { now: LOCAL_NOW, stateCode: "TX" });
    expect(chips.map((c) => c.label)).toEqual(["+4 yrs", "+8 yrs"]);
  });

  it("offers plausible adult birth dates", () => {
    const chips = getDateChips("DBB", {}, { now: LOCAL_NOW });
    expect(chips.map((c) => c.value)).toEqual(["08112008", "08112005", "08111986"]);
  });

  // Ages are measured at issuance. Counting back from today on a card issued in
  // 2020 would make the "18 yrs ago" holder 12 when it was issued, which trips
  // the minimum-age rule the chip exists to keep the user clear of.
  it("anchors the birth-date chips to the issue date", () => {
    const chips = getDateChips("DBB", { DBD: "01012020" }, { now: LOCAL_NOW });
    expect(chips.map((c) => c.value)).toEqual(["01012002", "01011999", "01011980"]);
    expect(chips[0]!.title).toContain("at issue");
    expect(yearsBetween(chips[0]!.value, "01012020")).toBe(18);
  });

  it("offers to match the issue date for the card revision date", () => {
    expect(getDateChips("DDB", { DBD: "01012024" }, { now: LOCAL_NOW })).toEqual([
      { label: "Match issue", value: "01012024", title: "Same as the issue date — Jan 1, 2024" }
    ]);
    expect(getDateChips("DDB", {}, { now: LOCAL_NOW })).toEqual([]);
  });

  it("emits the field's wire format", () => {
    expect(getDateChips("DBD", {}, { format: "YYYYMMDD", now: LOCAL_NOW })[0]!.value).toBe(
      "20260811"
    );
  });

  it("has nothing to offer for non-date fields", () => {
    expect(getDateChips("DCS", {}, { now: LOCAL_NOW })).toEqual([]);
  });
});

describe("shiftYears", () => {
  it("moves whole years in either direction", () => {
    expect(shiftYears("08112026", 8)).toBe("08112034");
    expect(shiftYears("08112026", -18)).toBe("08112008");
  });

  // Feb 29 + 1 year is not a date; clamping beats rolling into March.
  it("clamps Feb 29 into a non-leap target year", () => {
    expect(shiftYears("02292024", 1)).toBe("02282025");
    expect(shiftYears("02292024", 4)).toBe("02292028");
  });

  it("returns null for an unparseable source", () => {
    expect(shiftYears("nope", 1)).toBeNull();
  });
});
