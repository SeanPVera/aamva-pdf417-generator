import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VersionBrowser } from "../components/VersionBrowser";
import { useFormStore } from "../hooks/useFormStore";

describe("VersionBrowser component", () => {
  beforeEach(() => {
    useFormStore.setState({
      state: "CA",
      version: "10"
    });
  });

  it("expands and allows filtering fields by search query", () => {
    render(<VersionBrowser />);

    // Toggle open
    const toggleBtn = screen.getByRole("button", { name: /version browser/i });
    fireEvent.click(toggleBtn);

    // Filter input should be present
    const searchInput = screen.getByPlaceholderText(/search code or label/i);
    expect(searchInput).toBeInTheDocument();

    // Type query matching 'DCA'
    fireEvent.change(searchInput, { target: { value: "DCA" } });
    expect(screen.getByText("DCA")).toBeInTheDocument();

    // Type query with no matches
    fireEvent.change(searchInput, { target: { value: "NONEXISTENT_QUERY" } });
    expect(screen.getByRole("status")).toHaveTextContent("No fields matching ‘NONEXISTENT_QUERY’");
  });

  it("allows setting browsed version as active version", () => {
    render(<VersionBrowser />);

    // Toggle open
    fireEvent.click(screen.getByRole("button", { name: /version browser/i }));

    // Change browsed version select to '08'
    const select = screen.getByLabelText(/browse version/i);
    fireEvent.change(select, { target: { value: "08" } });

    // Action button should appear
    const setBtn = screen.getByRole("button", { name: /set v08 as active/i });
    expect(setBtn).toBeInTheDocument();

    // Click set button
    fireEvent.click(setBtn);

    // Form store active version should now be '08'
    expect(useFormStore.getState().version).toBe("08");

    // Button should be replaced by active indicator
    expect(screen.getByText(/active form version/i)).toBeInTheDocument();
  });
});
