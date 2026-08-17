import { describe, test, expect, beforeEach } from "vitest";
import { useFormStore } from "../hooks/useFormStore";
import { FIELD_HELP, getFieldHelp } from "../core/fieldHelp";

describe("Phase 3 — useFormStore tour state", () => {
  beforeEach(() => {
    useFormStore.setState({ tourSeenAt: "" });
  });

  test("tourSeenAt starts empty so the tour opens by default", () => {
    expect(useFormStore.getState().tourSeenAt).toBe("");
  });

  test("markTourSeen records an ISO timestamp", () => {
    useFormStore.getState().markTourSeen();
    const stamp = useFormStore.getState().tourSeenAt;
    expect(stamp.length).toBeGreaterThan(0);
    expect(() => new Date(stamp).toISOString()).not.toThrow();
  });

  test("resetTour clears the timestamp so the tour can replay", () => {
    useFormStore.getState().markTourSeen();
    useFormStore.getState().resetTour();
    expect(useFormStore.getState().tourSeenAt).toBe("");
  });
});

describe("Phase 3 — FIELD_HELP registry", () => {
  test("DCF, DAQ, DDB have help text (the auto-generated fields)", () => {
    expect(getFieldHelp("DCF")).toBeTruthy();
    expect(getFieldHelp("DAQ")).toBeTruthy();
    expect(getFieldHelp("DDB")).toBeTruthy();
  });

  test("REAL ID compliance and truncation indicators have help text", () => {
    expect(getFieldHelp("DDA")).toBeTruthy();
    expect(getFieldHelp("DDE")).toBeTruthy();
    expect(getFieldHelp("DDF")).toBeTruthy();
    expect(getFieldHelp("DDG")).toBeTruthy();
  });

  test("getFieldHelp returns undefined for fields without entries", () => {
    expect(getFieldHelp("ZZZ")).toBeUndefined();
  });

  // DBC renders as a free-text box on every version except 01 — the digits are
  // the whole content of the field and nothing on screen said what they mean.
  test("DBC explains the sex coding for both encodings", () => {
    const help = getFieldHelp("DBC");
    expect(help).toBeTruthy();
    expect(help).toContain("1 = male");
    expect(help).toContain("2 = female");
    expect(help).toContain("9 = not specified");
    // Version 01 predates the numeric scheme; the help has to say so or it is
    // wrong for that version's M / F values.
    expect(help).toMatch(/M \/ F/);
  });

  test("every help entry is a non-trivial sentence", () => {
    for (const [, text] of Object.entries(FIELD_HELP)) {
      expect(text.length).toBeGreaterThan(20);
    }
  });
});
