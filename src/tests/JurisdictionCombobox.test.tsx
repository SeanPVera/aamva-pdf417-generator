import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { JurisdictionCombobox } from "../components/JurisdictionCombobox";

describe("JurisdictionCombobox Component", () => {
  const defaultProps = {
    value: "CA",
    onChange: vi.fn(),
    recent: ["CA", "NY"]
  };

  test("renders clear search button with aria-label and title when query is typed", () => {
    render(<JurisdictionCombobox {...defaultProps} />);

    const input = screen.getByRole("combobox", { name: "Select state or territory" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Cal" } });

    const clearBtn = screen.getByRole("button", { name: "Clear jurisdiction search" });
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn).toHaveAttribute("title", "Clear jurisdiction search");
    expect(clearBtn).toHaveAttribute("aria-label", "Clear jurisdiction search");
  });
});
