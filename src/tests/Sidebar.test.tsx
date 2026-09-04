import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import React from "react";
import { Sidebar } from "../components/Sidebar";
import { useFormStore } from "../hooks/useFormStore";

// We don't need to deeply mock VersionBrowser, just make sure it renders safely.
vi.mock("../components/VersionBrowser", () => ({
  VersionBrowser: () => <div data-testid="version-browser-mock">Version Browser</div>
}));

describe("Sidebar Component", () => {
  beforeEach(() => {
    // Reset the store to a known state before each test
    useFormStore.setState({
      state: "CA",
      version: "10",
      subfileType: "DL",
      strictMode: false,
      fields: {},
      _history: [],
      _future: [],
      recentStates: ["CA"],
      badgeStats: {
        visitedStates: [],
        generated: 0,
        cleanGenerated: 0,
        firstTryClean: false,
        undos: 0,
        redos: 0,
        exports: 0,
        batchRows: 0,
        nightShift: false
      }
    });
  });

  test("toggles strict mode", async () => {
    render(<Sidebar />);
    expect(await screen.findByTestId("version-browser-mock")).toBeInTheDocument();

    const strictModeCheckbox = screen.getByRole("checkbox", { name: "Strict Compliance Mode" });
    expect(strictModeCheckbox).not.toBeChecked();

    fireEvent.click(strictModeCheckbox);
    expect(strictModeCheckbox).toBeChecked();
    expect(useFormStore.getState().strictMode).toBe(true);
  });

  test("changes subfile type", async () => {
    render(<Sidebar />);
    expect(await screen.findByTestId("version-browser-mock")).toBeInTheDocument();

    const subfileSelect = screen.getByRole("combobox", { name: "Select subfile type" });
    expect(subfileSelect).toHaveValue("DL");

    fireEvent.change(subfileSelect, { target: { value: "ID" } });
    expect(subfileSelect).toHaveValue("ID");
    expect(useFormStore.getState().subfileType).toBe("ID");
  });

  test("changes AAMVA version", async () => {
    render(<Sidebar />);
    expect(await screen.findByTestId("version-browser-mock")).toBeInTheDocument();

    const versionSelect = screen.getByRole("combobox", { name: "Select AAMVA version" });
    expect(versionSelect).toHaveValue("10");

    fireEvent.change(versionSelect, { target: { value: "08" } });
    expect(versionSelect).toHaveValue("08");
    expect(useFormStore.getState().version).toBe("08");
  });

  test("changing state updates state and resets to default version", async () => {
    render(<Sidebar />);
    expect(await screen.findByTestId("version-browser-mock")).toBeInTheDocument();

    // First change the version so it's not the default
    const versionSelect = screen.getByRole("combobox", { name: "Select AAMVA version" });
    fireEvent.change(versionSelect, { target: { value: "08" } });
    expect(useFormStore.getState().version).toBe("08");

    // Change state via combobox using testing-library commands that simulate user input
    const comboboxes = screen.getAllByRole("combobox");
    const stateCombobox = comboboxes[0];

    // Click to open the combobox, which renders the list of states
    fireEvent.click(screen.getAllByRole("button")[0]); // Open combobox list

    // Find and click 'Texas' (which has a default version of '10' based on memory)
    // We can also just directly update the input as we are using JurisdictionCombobox which is accessible
    fireEvent.change(stateCombobox, { target: { value: "Texas" } });
    fireEvent.keyDown(stateCombobox, { key: "Enter", code: "Enter" });

    // The store should now have TX and version 10
    expect(useFormStore.getState().state).toBe("TX");
    expect(useFormStore.getState().version).toBe("10"); // resets to default
  });

  test("shows excluded fields notice for NY state", async () => {
    // Set state to NY so it triggers the AAMVA_STATE_EXCLUDED_FIELDS rendering
    useFormStore.setState({ state: "NY", version: "10" });
    render(<Sidebar />);
    expect(await screen.findByTestId("version-browser-mock")).toBeInTheDocument();

    // Verify notice is shown
    // Note: Due to React testing-library's rendering of split elements,
    // it's sometimes better to match by role or sub-elements.
    // The strong tag contains NY, and the text says "does not encode".
    expect(
      screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === "p" && content.includes("does not encode");
      })
    ).toBeInTheDocument();

    // Verify dismiss works
    const dismissButton = screen.getByRole("button", { name: "Dismiss exclusion notice" });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/NY does not encode/i)).not.toBeInTheDocument();
  });

  test("renders core configuration elements", async () => {
    render(<Sidebar />);

    // Wait for the suspended VersionBrowser to load
    expect(await screen.findByTestId("version-browser-mock")).toBeInTheDocument();

    // Check headings and labels
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("State / Territory")).toBeInTheDocument();
    expect(screen.getByText("AAMVA Version")).toBeInTheDocument();
    expect(screen.getByText("Subfile Type")).toBeInTheDocument();
    expect(screen.getByText("Strict Compliance Mode")).toBeInTheDocument();
    expect(screen.getByText("Schema Info")).toBeInTheDocument();

    // Check specific interactive elements (they should have the default values)
    // The jurisdiction combobox sets aria-labelledby implicitly via the label's htmlFor="state-select",
    // but testing-library often needs explicit naming or we can just grab it by role.
    const comboboxes = screen.getAllByRole("combobox");
    const stateCombobox = comboboxes[0]; // Assuming State is first combobox
    expect(stateCombobox).toHaveValue("California (CA)");

    const versionSelect = screen.getByRole("combobox", { name: "Select AAMVA version" });
    expect(versionSelect).toHaveValue("10");

    const subfileSelect = screen.getByRole("combobox", { name: "Select subfile type" });
    expect(subfileSelect).toHaveValue("DL");

    const strictModeCheckbox = screen.getByRole("checkbox", { name: "Strict Compliance Mode" });
    expect(strictModeCheckbox).not.toBeChecked();
  });
});
