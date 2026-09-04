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
  // The cells hold a bare glyph. An aria-label on a span with no role is not
  // reliably honoured, so the label can be dropped and a screen reader reads
  // the raw "✓" or nothing at all; role="img" is what makes it announce.
  it("announces the required and optional indicators rather than their glyphs", () => {
    render(<VersionBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /Version Browser/i }));

    const required = screen.getAllByRole("img", { name: "Required" });
    const optional = screen.getAllByRole("img", { name: "Optional" });
    expect(required.length).toBeGreaterThan(0);
    expect(optional.length).toBeGreaterThan(0);

    // title gives a sighted mouse user the same word the glyph stands for.
    expect(required[0]).toHaveAttribute("title", "Required");
    expect(optional[0]).toHaveAttribute("title", "Optional");
  });
});
