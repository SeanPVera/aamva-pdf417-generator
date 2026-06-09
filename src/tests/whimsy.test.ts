import { describe, it, expect } from "vitest";
import { buildExportBasename } from "../core/exportNaming";
import { getStateCritter, STATE_CRITTERS, DEFAULT_CRITTER } from "../core/stateCritters";
import { getClerkQuip, clerkQuipCount, type ClerkMood } from "../core/clerkQuips";

describe("buildExportBasename", () => {
  it("includes state, split name fields, and subfile type", () => {
    const name = buildExportBasename({
      state: "CA",
      version: "10",
      fields: { DCS: "Doe", DAC: "Jane" },
      subfileType: "DL",
      prefix: "barcode"
    });
    expect(name).toBe("BARCODE_CA_DOE_JANE_DL");
  });

  it("falls back to state + version when no name present", () => {
    const name = buildExportBasename({ state: "TX", version: "09", fields: {} });
    expect(name).toBe("TX_DL_V09");
  });

  it("derives name from a combined v01 DAA field", () => {
    const name = buildExportBasename({
      state: "NY",
      version: "01",
      fields: { DAA: "SMITH,JOHN,Q" },
      subfileType: "ID"
    });
    expect(name).toBe("NY_SMITH_JOHN_ID");
  });

  it("strips unsafe characters and uppercases", () => {
    const name = buildExportBasename({
      state: "fl",
      version: "10",
      fields: { DCS: "O'Brien-Smith", DAC: "Mary Jo" }
    });
    expect(name).toBe("FL_OBRIENSMITH_MARYJO_DL");
  });

  it("never emits an empty basename", () => {
    const name = buildExportBasename({ state: "", version: "", fields: {} });
    expect(name.length).toBeGreaterThan(0);
  });
});

describe("getStateCritter", () => {
  it("returns the curated critter for a known state", () => {
    expect(getStateCritter("CA").name).toMatch(/bear/i);
  });

  it("falls back to the default critter for unknown codes", () => {
    expect(getStateCritter("ZZ")).toEqual(DEFAULT_CRITTER);
  });

  it("every entry has a non-empty emoji and name", () => {
    for (const [code, critter] of Object.entries(STATE_CRITTERS)) {
      expect(critter.emoji, code).toBeTruthy();
      expect(critter.name, code).toBeTruthy();
    }
  });
});

describe("getClerkQuip", () => {
  const moods: ClerkMood[] = ["idle", "happy", "error", "asleep"];

  it("returns a stable quip for a given seed", () => {
    expect(getClerkQuip("happy", 1)).toBe(getClerkQuip("happy", 1));
  });

  it("wraps the seed around the available quips", () => {
    for (const mood of moods) {
      const count = clerkQuipCount(mood);
      expect(getClerkQuip(mood, count)).toBe(getClerkQuip(mood, 0));
    }
  });

  it("handles negative and fractional seeds", () => {
    expect(typeof getClerkQuip("idle", -3.7)).toBe("string");
    expect(getClerkQuip("idle", -3.7).length).toBeGreaterThan(0);
  });
});
