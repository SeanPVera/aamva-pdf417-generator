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
