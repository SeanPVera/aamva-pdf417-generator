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

  test("wrapping label containers have focus-within ring styling for filter badges", () => {
    render(<FieldFilters {...defaultProps} />);

    const requiredCheckbox = screen.getByRole("checkbox", {
      name: "Show only required fields"
    });
    const requiredLabel = requiredCheckbox.closest("label");
    expect(requiredLabel).toHaveClass("focus-within:ring-2");
    expect(requiredLabel).toHaveClass("focus-within:ring-brand-500");

    const issuesCheckbox = screen.getByRole("checkbox", {
      name: "Show only fields with validation issues"
    });
    const issuesLabel = issuesCheckbox.closest("label");
    expect(issuesLabel).toHaveClass("focus-within:ring-2");
    expect(issuesLabel).toHaveClass("focus-within:ring-brand-500");
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

    const requiredCheckbox = screen.getByRole("checkbox", {
      name: "Show only required fields"
    });
    fireEvent.click(requiredCheckbox);
    expect(onRequiredOnlyChange).toHaveBeenCalledWith(true);

    const issuesCheckbox = screen.getByRole("checkbox", {
      name: "Show only fields with validation issues"
    });
    fireEvent.click(issuesCheckbox);
    expect(onIssuesOnlyChange).toHaveBeenCalledWith(true);
  });
});
