import { describe, it, expect } from "vitest";
import { describeActiveFilters } from "../components/filterSummary";

describe("describeActiveFilters", () => {
  it("names the search query when only search is active", () => {
    const msg = describeActiveFilters("DAQ", false);
    expect(msg).toContain("the search “DAQ”");
    expect(msg).not.toContain("Required filter");
  });

  it("names the required filter when only it is active", () => {
    const msg = describeActiveFilters("", true);
    expect(msg).toContain("the Required filter");
    expect(msg).not.toContain("the search");
  });

  it("names both filters when both are active", () => {
    const msg = describeActiveFilters("zzz", true);
    expect(msg).toContain("the search “zzz”");
    expect(msg).toContain("and the Required filter");
  });

  it("ignores a whitespace-only query", () => {
    const msg = describeActiveFilters("   ", true);
    expect(msg).toContain("the Required filter");
    expect(msg).not.toContain("the search");
  });

  it("trims the query before quoting it", () => {
    expect(describeActiveFilters("  DAQ  ", false)).toContain("“DAQ”");
  });

  it("falls back to an explanatory message when no filter is active", () => {
    const msg = describeActiveFilters("", false);
    expect(msg).toContain("no fields to display");
  });

  it("always tells the user filters can be reset when one is active", () => {
    expect(describeActiveFilters("x", false)).toContain("resetting your filters");
  });
});
