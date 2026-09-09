import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { JurisdictionCombobox } from "../components/JurisdictionCombobox";

describe("JurisdictionCombobox Component", () => {
  const defaultProps = {
    value: "CA",
    onChange: vi.fn(),
    recent: ["CA", "NY"]
  };

  test("hides search icon and shows clear button when search query is entered", () => {
    const { container } = render(<JurisdictionCombobox {...defaultProps} />);

    const input = screen.getByRole("combobox", { name: "Select state or territory" });
    fireEvent.focus(input);

    // Search icon should be visible when open and query is empty
    expect(container.querySelector(".lucide-search")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear jurisdiction search" })
    ).not.toBeInTheDocument();

    // Type query
    fireEvent.change(input, { target: { value: "Cal" } });

    // Search icon should be hidden when query is present
    expect(container.querySelector(".lucide-search")).not.toBeInTheDocument();

    // Clear search button should be visible
    const clearBtn = screen.getByRole("button", { name: "Clear jurisdiction search" });
    expect(clearBtn).toBeInTheDocument();

    // Clicking clear button resets search query and restores search icon
    fireEvent.click(clearBtn);
    expect(
      screen.queryByRole("button", { name: "Clear jurisdiction search" })
    ).not.toBeInTheDocument();
    expect(container.querySelector(".lucide-search")).toBeInTheDocument();
  });
});
