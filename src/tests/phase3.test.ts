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

  test("every help entry is a non-trivial sentence", () => {
    for (const [, text] of Object.entries(FIELD_HELP)) {
      expect(text.length).toBeGreaterThan(20);
    }
  });
});
