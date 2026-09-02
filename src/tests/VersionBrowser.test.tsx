import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { VersionBrowser } from "../components/VersionBrowser";

describe("VersionBrowser", () => {
  it("renders closed initially and expands on click", () => {
    render(<VersionBrowser />);
    const button = screen.getByRole("button", { name: /version browser/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Browse version")).toBeInTheDocument();
  });

  it("renders field status indicators with role='img', aria-label, and title attributes", () => {
    render(<VersionBrowser />);
    const button = screen.getByRole("button", { name: /version browser/i });
    fireEvent.click(button);

    const requiredBadges = screen.getAllByTitle("Required");
    expect(requiredBadges.length).toBeGreaterThan(0);
    const firstRequired = requiredBadges[0];
    expect(firstRequired).toHaveAttribute("role", "img");
    expect(firstRequired).toHaveAttribute("aria-label", "Required");

    const optionalBadges = screen.getAllByTitle("Optional");
    expect(optionalBadges.length).toBeGreaterThan(0);
    const firstOptional = optionalBadges[0];
    expect(firstOptional).toHaveAttribute("role", "img");
    expect(firstOptional).toHaveAttribute("aria-label", "Optional");
  });
});
