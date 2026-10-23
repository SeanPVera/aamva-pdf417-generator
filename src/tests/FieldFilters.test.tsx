import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { FieldFilters } from "../components/FieldFilters";

describe("FieldFilters Component", () => {
  test("clearing a query preserves the active filters and does not advertise Escape", () => {
    const onQueryChange = vi.fn();
    const onRequiredOnlyChange = vi.fn();
    const onIssuesOnlyChange = vi.fn();
    render(
      <FieldFilters
        {...defaultProps}
        query="license"
        requiredOnly
        issuesOnly
        onQueryChange={onQueryChange}
        onRequiredOnlyChange={onRequiredOnlyChange}
        onIssuesOnlyChange={onIssuesOnlyChange}
      />
    );
    const button = screen.getByRole("button", { name: "Clear field search" });
    expect(button).toHaveAttribute("title", "Clear field search");
    fireEvent.click(button);
    expect(onQueryChange).toHaveBeenCalledWith("");
    expect(onRequiredOnlyChange).not.toHaveBeenCalled();
    expect(onIssuesOnlyChange).not.toHaveBeenCalled();
  });
  const defaultProps = {
    query: "",
    onQueryChange: vi.fn(),
    requiredOnly: false,
    onRequiredOnlyChange: vi.fn(),
    issuesOnly: false,
    onIssuesOnlyChange: vi.fn(),
    issueCount: 2,
    matchCount: 10,
    totalCount: 30,
    requiredFilled: 5,
    requiredTotal: 10,
    onJumpToNextEmpty: vi.fn(),
    hasNextEmpty: true,
    onGenerateAutoFields: vi.fn()
  };

  test("filters have distinct accessible labels and state", () => {
    render(<FieldFilters {...defaultProps} />);
    expect(screen.getByRole("checkbox", { name: "Show only required fields" })).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Show only fields with validation issues" })
    ).toBeEnabled();
  });
  test("an empty inactive issue filter is disabled", () => {
    render(<FieldFilters {...defaultProps} issueCount={0} />);
    expect(
      screen.getByRole("checkbox", { name: "Show only fields with validation issues" })
    ).toBeDisabled();
  });
  test("an active issue filter can be cleared after the final error is fixed", () => {
    const clear = vi.fn();
    render(<FieldFilters {...defaultProps} issueCount={0} issuesOnly onIssuesOnlyChange={clear} />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show only fields with validation issues" })
    );
    expect(clear).toHaveBeenCalledWith(false);
  });
  test("Escape clears every filter without losing record data", () => {
    const query = vi.fn(),
      required = vi.fn(),
      issues = vi.fn();
    render(
      <FieldFilters
        {...defaultProps}
        query="name"
        onQueryChange={query}
        onRequiredOnlyChange={required}
        onIssuesOnlyChange={issues}
      />
    );
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(query).toHaveBeenCalledWith("");
    expect(required).toHaveBeenCalledWith(false);
    expect(issues).toHaveBeenCalledWith(false);
  });

  test("triggers checkbox callbacks on toggle", () => {
    const onRequiredOnlyChange = vi.fn();
    const onIssuesOnlyChange = vi.fn();

    render(
      <FieldFilters
        {...defaultProps}
        onRequiredOnlyChange={onRequiredOnlyChange}
        onIssuesOnlyChange={onIssuesOnlyChange}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Show only required fields" }));
    expect(onRequiredOnlyChange).toHaveBeenCalledWith(true);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show only fields with validation issues" })
    );
    expect(onIssuesOnlyChange).toHaveBeenCalledWith(true);
  });

  test("Fill tools menu closes on option selection, Escape key, and click outside", () => {
    const onGenerateAutoFields = vi.fn();
    const onFillSample = vi.fn();

    render(
      <FieldFilters
        {...defaultProps}
        onGenerateAutoFields={onGenerateAutoFields}
        onFillSample={onFillSample}
      />
    );

    const summary = screen.getByText("Fill tools");
    const details = summary.closest("details") as HTMLDetailsElement;

    // Open details popover
    details.open = true;

    // Verify titles match aria-labels
    const genButton = screen.getByRole("button", { name: "Generate auto fields (DCF, DAQ, DDB)" });
    const sampleButton = screen.getByRole("button", { name: "Fill all fields with demo data" });
    expect(genButton).toHaveAttribute("title", "Generate auto fields (DCF, DAQ, DDB)");
    expect(sampleButton).toHaveAttribute("title", "Fill all fields with demo data");

    // Click option auto-closes details popover
    fireEvent.click(genButton);
    expect(onGenerateAutoFields).toHaveBeenCalledTimes(1);
    expect(details.open).toBe(false);

    // Re-open and test Escape key closing popover
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);

    // Re-open and test click outside closing popover
    details.open = true;
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });
});
