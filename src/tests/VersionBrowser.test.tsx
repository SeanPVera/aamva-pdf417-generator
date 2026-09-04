import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { VersionBrowser } from "../components/VersionBrowser";
import { useFormStore } from "../hooks/useFormStore";

describe("VersionBrowser component", () => {
  beforeEach(() => {
    useFormStore.setState({
      state: "CA",
      version: "10"
    });
  });

  it("renders collapsed initially and expands on click", () => {
    render(<VersionBrowser />);
    const toggleBtn = screen.getByRole("button", { name: /Version Browser/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.queryByLabelText(/Filter fields in version browser/i)).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText(/Filter fields in version browser/i)).toBeInTheDocument();
  });

  it("filters fields by search query and allows clearing", () => {
    render(<VersionBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /Version Browser/i }));

    const searchInput = screen.getByLabelText(/Filter fields in version browser/i);
    expect(searchInput).toBeInTheDocument();

    // Type a specific field code, e.g. "DCA"
    fireEvent.change(searchInput, { target: { value: "DCA" } });
    expect(screen.getByText("DCA")).toBeInTheDocument();
    expect(screen.queryByText("DCF")).not.toBeInTheDocument();

    // Clear filter
    const clearBtn = screen.getByRole("button", { name: /Clear version browser filter/i });
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue("");
    expect(screen.getByText("DCF")).toBeInTheDocument();
  });

  it("shows 'Set as active' action when browsing a non-active version and updates state", () => {
    render(<VersionBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /Version Browser/i }));

    const select = screen.getByLabelText(/Browse version/i);
    fireEvent.change(select, { target: { value: "08" } });

    const setActiveBtn = screen.getByRole("button", { name: /Set v08 as active/i });
    expect(setActiveBtn).toBeInTheDocument();

    fireEvent.click(setActiveBtn);
    expect(useFormStore.getState().version).toBe("08");
    expect(screen.queryByRole("button", { name: /Set v08 as active/i })).not.toBeInTheDocument();
  });

  it("renders status symbols with role='img', aria-label, and title attributes", () => {
    render(<VersionBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /Version Browser/i }));

    const requiredIndicators = screen.getAllByRole("img", { name: "Required" });
    expect(requiredIndicators.length).toBeGreaterThan(0);
    expect(requiredIndicators[0]).toHaveAttribute("title", "Required");

    const optionalIndicators = screen.getAllByRole("img", { name: "Optional" });
    expect(optionalIndicators.length).toBeGreaterThan(0);
    expect(optionalIndicators[0]).toHaveAttribute("title", "Optional");
  });
});
