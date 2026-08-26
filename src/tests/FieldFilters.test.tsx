import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FieldFilters } from "../components/FieldFilters";

describe("FieldFilters", () => {
  const defaultProps = {
    query: "",
    onQueryChange: vi.fn(),
    requiredOnly: false,
    onRequiredOnlyChange: vi.fn(),
    issuesOnly: false,
    onIssuesOnlyChange: vi.fn(),
    issueCount: 0,
    matchCount: 10,
    totalCount: 10,
    requiredFilled: 5,
    requiredTotal: 5,
    onJumpToNextEmpty: vi.fn(),
    hasNextEmpty: false,
    onGenerateAutoFields: vi.fn()
  };

  it("renders search input and clear search button when query is present", () => {
    const onQueryChange = vi.fn();
    const { rerender } = render(
      <FieldFilters {...defaultProps} query="" onQueryChange={onQueryChange} />
    );

    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();

    rerender(<FieldFilters {...defaultProps} query="test" onQueryChange={onQueryChange} />);

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.className).toContain("focus-visible:ring-2");

    fireEvent.click(clearBtn);
    expect(onQueryChange).toHaveBeenCalledWith("");
  });
});
