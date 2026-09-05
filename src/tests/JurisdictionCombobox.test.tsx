import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { JurisdictionCombobox } from "../components/JurisdictionCombobox";

describe("JurisdictionCombobox Component", () => {
  test("renders closed state with selected jurisdiction label", () => {
    const handleChange = vi.fn();
    render(<JurisdictionCombobox value="CA" onChange={handleChange} recent={["CA"]} />);

    const combobox = screen.getByRole("combobox", { name: "Select state or territory" });
    expect(combobox).toHaveValue("California (CA)");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
  });

  test("opens listbox on focus and hides search icon when query is entered", () => {
    const handleChange = vi.fn();
    render(<JurisdictionCombobox value="CA" onChange={handleChange} recent={["CA", "TX"]} />);

    const combobox = screen.getByRole("combobox", { name: "Select state or territory" });

    // Focus combobox to open
    fireEvent.focus(combobox);
    expect(combobox).toHaveAttribute("aria-expanded", "true");

    // Clear search button should not exist initially when query is empty
    expect(
      screen.queryByRole("button", { name: "Clear jurisdiction search" })
    ).not.toBeInTheDocument();

    // Type query "Tex"
    fireEvent.change(combobox, { target: { value: "Tex" } });

    // Clear search button should now be visible
    const clearButton = screen.getByRole("button", { name: "Clear jurisdiction search" });
    expect(clearButton).toBeInTheDocument();

    // Clicking clear resets query and keeps focus
    fireEvent.click(clearButton);
    expect(combobox).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "Clear jurisdiction search" })
    ).not.toBeInTheDocument();
  });

  test("selecting an option triggers onChange with code", () => {
    const handleChange = vi.fn();
    render(<JurisdictionCombobox value="CA" onChange={handleChange} recent={[]} />);

    const combobox = screen.getByRole("combobox", { name: "Select state or territory" });
    fireEvent.focus(combobox);

    // Click Texas option
    const texasOption = screen.getByRole("option", { name: /TX Texas/i });
    fireEvent.click(texasOption);

    expect(handleChange).toHaveBeenCalledWith("TX");
  });
});
