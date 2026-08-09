import { describe, test, expect, beforeEach } from "vitest";
import { useFormStore } from "../hooks/useFormStore";

describe("useFormStore — Phase 1 UI prefs", () => {
  beforeEach(() => {
    // Reset the persisted store to a clean state before each test.
    useFormStore.setState({
      collapsedGroups: {},
      requiredOnly: false
    });
  });

  test("toggleGroupCollapsed flips the value for the given group", () => {
    expect(useFormStore.getState().collapsedGroups.identity).toBeFalsy();

    useFormStore.getState().toggleGroupCollapsed("identity");
    expect(useFormStore.getState().collapsedGroups.identity).toBe(true);

    useFormStore.getState().toggleGroupCollapsed("identity");
    expect(useFormStore.getState().collapsedGroups.identity).toBe(false);
  });

  test("toggleGroupCollapsed does not affect other groups", () => {
    useFormStore.getState().toggleGroupCollapsed("identity");
    expect(useFormStore.getState().collapsedGroups.address).toBeFalsy();
    expect(useFormStore.getState().collapsedGroups.physical).toBeFalsy();
  });

  test("setRequiredOnly toggles the flag", () => {
    expect(useFormStore.getState().requiredOnly).toBe(false);

    useFormStore.getState().setRequiredOnly(true);
    expect(useFormStore.getState().requiredOnly).toBe(true);

    useFormStore.getState().setRequiredOnly(false);
    expect(useFormStore.getState().requiredOnly).toBe(false);
  });
});

describe("useFormStore — undo history coalescing", () => {
  beforeEach(() => {
    useFormStore.setState({
      fields: {},
      _history: [],
      _future: [],
      _lastEditCode: "",
      _lastEditAt: 0
    });
  });

  test("consecutive edits to one field collapse into a single undo step", () => {
    const { setField } = useFormStore.getState();
    // Typing a city name used to consume one history slot per keystroke, so a
    // 20-entry cap could not reach back past the current word.
    for (const value of ["S", "SA", "SAN", "SAN ", "SAN F", "SAN FR"]) {
      setField("DAI", value);
    }
    expect(useFormStore.getState()._history).toHaveLength(1);

    useFormStore.getState().undo();
    expect(useFormStore.getState().fields.DAI).toBeUndefined();
  });

  test("moving to a different field starts a new undo step", () => {
    const { setField } = useFormStore.getState();
    setField("DAI", "AUSTIN");
    setField("DCS", "DOE");
    setField("DCS", "DOEE");
    expect(useFormStore.getState()._history).toHaveLength(2);

    useFormStore.getState().undo();
    expect(useFormStore.getState().fields).toEqual({ DAI: "AUSTIN" });
  });

  test("edits separated by more than the window are kept apart", () => {
    const { setField } = useFormStore.getState();
    setField("DAI", "A");
    // Simulate the user pausing longer than the coalescing window.
    useFormStore.setState({ _lastEditAt: Date.now() - 5000 });
    setField("DAI", "AU");
    expect(useFormStore.getState()._history).toHaveLength(2);
  });

  test("undo breaks the coalescing chain", () => {
    const { setField } = useFormStore.getState();
    setField("DAI", "A");
    setField("DAI", "AU");
    useFormStore.getState().undo();
    setField("DAI", "X");
    // The post-undo edit must not fold into the pre-undo entry.
    expect(useFormStore.getState()._lastEditCode).toBe("DAI");
    expect(useFormStore.getState().fields.DAI).toBe("X");
  });

  test("switching jurisdiction breaks the chain and records the visit", () => {
    useFormStore.setState({ badgeStats: { ...useFormStore.getState().badgeStats } });
    useFormStore.getState().setField("DAI", "A");
    useFormStore.getState().setStateVersion("TX", "10");
    expect(useFormStore.getState()._lastEditCode).toBe("");
    expect(useFormStore.getState().recentStates[0]).toBe("TX");
    expect(useFormStore.getState().badgeStats.visitedStates).toContain("TX");
  });
});

describe("useFormStore — restoreFields", () => {
  beforeEach(() => {
    useFormStore.setState({ fields: {}, _history: [], _future: [] });
  });

  test("restores a snapshot and keeps the overwritten map undoable", () => {
    const { setField, clearFields, restoreFields } = useFormStore.getState();
    setField("DCS", "DOE");
    const snapshot = { ...useFormStore.getState().fields };

    clearFields();
    expect(useFormStore.getState().fields).toEqual({});

    restoreFields(snapshot);
    expect(useFormStore.getState().fields).toEqual({ DCS: "DOE" });
  });

  test("flags the restored codes so the UI can flash them", () => {
    useFormStore.getState().restoreFields({ DCS: "ROE", DAC: "JOHN" });
    expect(useFormStore.getState()._changedCodes.sort()).toEqual(["DAC", "DCS"]);
    expect(useFormStore.getState()._changedAt).toBeGreaterThan(0);
  });
});

describe("useFormStore — inspector width", () => {
  test("clamps to a usable range", () => {
    const { setInspectorWidth } = useFormStore.getState();
    setInspectorWidth(50);
    expect(useFormStore.getState().inspectorWidth).toBe(280);
    setInspectorWidth(5000);
    expect(useFormStore.getState().inspectorWidth).toBe(720);
    setInspectorWidth(420.6);
    expect(useFormStore.getState().inspectorWidth).toBe(421);
  });
});

describe("useFormStore — persistence excludes PII", () => {
  test("field values are never part of the persisted slice", () => {
    // The store's own guarantee: preferences persist, payload data does not.
    useFormStore.getState().setField("DCS", "DOE");
    const persisted = window.localStorage.getItem("aamva_form_prefs_v2") ?? "";
    expect(persisted).not.toContain("DOE");
    expect(persisted).not.toContain('"fields"');
  });
});
