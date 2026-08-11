import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useFormStore } from "../hooks/useFormStore";
import { buildSampleFill } from "../core/sampleFiller";
import { getFieldsForStateAndVersion } from "../core/schema";

/**
 * Bulk actions used to call `setField` once per field. A 28-field sample fill
 * therefore pushed 28 entries onto a 20-entry undo stack: everything the user
 * had typed before it was discarded, and the fill itself could not be undone
 * because the stack ran out partway through its own snapshots.
 */
describe("bulk field edits are a single undo step", () => {
  beforeEach(() => {
    useFormStore.setState({
      fields: {},
      _history: [],
      _future: [],
      _lastEditCode: "",
      _lastEditAt: 0
    });
  });

  it("mergeFields pushes exactly one history entry", () => {
    const { setField, mergeFields } = useFormStore.getState();
    act(() => setField("DAH", "APT 4B"));
    const depth = useFormStore.getState()._history.length;

    act(() => mergeFields({ DCS: "DOE", DAC: "JANE", DAD: "Q", DAI: "SPRINGFIELD" }));

    expect(useFormStore.getState()._history.length).toBe(depth + 1);
  });

  it("one undo reverses a whole sample fill", () => {
    const { setField, mergeFields, undo } = useFormStore.getState();
    act(() => setField("DAH", "APT 4B"));

    const sample = buildSampleFill(getFieldsForStateAndVersion("CA", "10"), "CA");
    expect(Object.keys(sample).length).toBeGreaterThan(20); // more than HISTORY_LIMIT
    act(() => mergeFields(sample));
    expect(useFormStore.getState().fields.DCS).toBe("DOE");

    act(() => undo());

    const after = useFormStore.getState().fields;
    expect(after.DCS).toBeUndefined();
    expect(after.DAH).toBe("APT 4B");
  });

  it("keeps values it was not given", () => {
    const { setField, mergeFields } = useFormStore.getState();
    act(() => setField("DAH", "APT 4B"));
    act(() => mergeFields({ DCS: "DOE" }));

    expect(useFormStore.getState().fields).toEqual({ DAH: "APT 4B", DCS: "DOE" });
  });

  it("marks the changed codes so the UI can flash them", () => {
    const { mergeFields } = useFormStore.getState();
    act(() => mergeFields({ DCS: "DOE", DAC: "JANE" }));

    expect(useFormStore.getState()._changedCodes.sort()).toEqual(["DAC", "DCS"]);
  });
});
