import { describe, it, expect } from "vitest";
import { describeActiveFilters } from "../components/filterSummary";

describe("describeActiveFilters", () => {
  it("names the search query when only search is active", () => {
    const msg = describeActiveFilters("DAQ", false, false, 3);
    expect(msg).toContain("the search “DAQ”");
    expect(msg).not.toContain("Required filter");
    expect(msg).not.toContain("Issues filter");
  });

  it("names the required filter when only it is active", () => {
    const msg = describeActiveFilters("", true, false, 3);
    expect(msg).toContain("the Required filter");
    expect(msg).not.toContain("the search");
  });

  it("names the issues filter when only it is active", () => {
    const msg = describeActiveFilters("", false, true, 3);
    expect(msg).toContain("the Issues filter");
  });

  it("names both filters when search and required are active", () => {
    const msg = describeActiveFilters("zzz", true, false, 3);
    expect(msg).toContain("the search “zzz”");
    expect(msg).toContain("and the Required filter");
  });

  it("names all three filters when all are active", () => {
    const msg = describeActiveFilters("zzz", true, true, 5);
    expect(msg).toContain("the search “zzz”");
    expect(msg).toContain("the Required filter");
    expect(msg).toContain("and the Issues filter");
  });

  // A clean form with the issues filter on is good news, not a mis-filter.
  it("reports a clean form rather than a dead end when the issues filter finds nothing", () => {
    const msg = describeActiveFilters("", false, true, 0);
    expect(msg).toBe("No validation issues — nothing to show with the issues filter on.");
  });

  it("prefers the clean-form message even when other filters are active", () => {
    const msg = describeActiveFilters("DAQ", true, true, 0);
    expect(msg).toContain("No validation issues");
  });

  it("ignores a whitespace-only query", () => {
    const msg = describeActiveFilters("   ", true, false, 3);
    expect(msg).toContain("the Required filter");
    expect(msg).not.toContain("the search");
  });

  it("trims the query before quoting it", () => {
    expect(describeActiveFilters("  DAQ  ", false, false, 3)).toContain("“DAQ”");
  });

  it("falls back to an explanatory message when no filter is active", () => {
    const msg = describeActiveFilters("", false, false, 0);
    expect(msg).toContain("no fields to display");
  });

  it("always tells the user filters can be reset when one is active", () => {
    expect(describeActiveFilters("x", false, false, 3)).toContain("resetting your filters");
  });
});
