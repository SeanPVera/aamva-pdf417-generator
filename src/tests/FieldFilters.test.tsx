import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { FieldFilters } from "../components/FieldFilters";

describe("FieldFilters Component", () => {
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

  // The ring lives on the label, not the checkbox: the badge is the visible
  // target and the input inside it is 3.5 units square.
  test("both filter badges ring on focus-within", () => {
    render(<FieldFilters {...defaultProps} />);

    const requiredLabel = screen
      .getByRole("checkbox", { name: "Show only required fields" })
      .closest("label");
    expect(requiredLabel).toHaveClass("focus-within:ring-2");

    const issuesLabel = screen
      .getByRole("checkbox", { name: "Show only fields with validation issues" })
      .closest("label");
    expect(issuesLabel).toHaveClass("focus-within:ring-2");
  });

  // The issues badge is red when it has issues to show and gray when it does
  // not, so a fixed brand ring would clash with it in one of those two states.
  test("the issues badge rings red while it is showing issues", () => {
    render(<FieldFilters {...defaultProps} issueCount={2} />);

    const issuesLabel = screen
      .getByRole("checkbox", { name: "Show only fields with validation issues" })
      .closest("label");
    expect(issuesLabel).toHaveClass("focus-within:ring-red-500");
    expect(issuesLabel).not.toHaveClass("focus-within:ring-brand-500");
  });

  test("the issues badge rings brand once it is empty and disabled", () => {
    render(<FieldFilters {...defaultProps} issueCount={0} />);

    const issuesCheckbox = screen.getByRole("checkbox", {
      name: "Show only fields with validation issues"
    });
    expect(issuesCheckbox).toBeDisabled();

    const issuesLabel = issuesCheckbox.closest("label");
    expect(issuesLabel).toHaveClass("focus-within:ring-brand-500");
    expect(issuesLabel).not.toHaveClass("focus-within:ring-red-500");
  });

  // A ring on the label plus a ring on the input inside it draws twice.
  test("the checkboxes do not draw a second ring inside the badge", () => {
    render(<FieldFilters {...defaultProps} />);

    for (const name of ["Show only required fields", "Show only fields with validation issues"]) {
      expect(screen.getByRole("checkbox", { name })).not.toHaveClass("focus-visible:ring-2");
    }
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
});
