import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, beforeEach } from "vitest";
import React from "react";
import { VersionBrowser } from "../components/VersionBrowser";
import { useFormStore } from "../hooks/useFormStore";

describe("VersionBrowser Component", () => {
  beforeEach(() => {
    useFormStore.setState({
      version: "10"
    });
  });

  test("renders closed by default and toggles open", () => {
    render(<VersionBrowser />);
    const toggleBtn = screen.getByRole("button", { name: /version browser/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.queryByLabelText("Filter fields")).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText("Filter fields")).toBeInTheDocument();
  });

  test("filters fields by code and label", () => {
    render(<VersionBrowser />);
    const toggleBtn = screen.getByRole("button", { name: /version browser/i });
    fireEvent.click(toggleBtn);

    const filterInput = screen.getByLabelText("Filter fields");

    // Search by code "DCA"
    fireEvent.change(filterInput, { target: { value: "DCA" } });
    expect(screen.getByText("DCA")).toBeInTheDocument();
    expect(screen.queryByText("DAQ")).not.toBeInTheDocument();

    // Search by label "Family Name"
    fireEvent.change(filterInput, { target: { value: "Family Name" } });
    expect(screen.getByText("DCS")).toBeInTheDocument();
  });

  test("shows empty state when no fields match search query", () => {
    render(<VersionBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /version browser/i }));

    const filterInput = screen.getByLabelText("Filter fields");
    fireEvent.change(filterInput, { target: { value: "NONEXISTENT123" } });

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveTextContent("No fields matching ‘NONEXISTENT123’ in v10.");
  });

  test("clears search filter when clear button is clicked", () => {
    render(<VersionBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /version browser/i }));

    const filterInput = screen.getByLabelText("Filter fields");
    fireEvent.change(filterInput, { target: { value: "DCA" } });

    const clearBtn = screen.getByRole("button", { name: "Clear field search" });
    fireEvent.click(clearBtn);

    expect(filterInput).toHaveValue("");
    expect(screen.getByText("DCA")).toBeInTheDocument();
    expect(screen.getByText("DAQ")).toBeInTheDocument();
  });
});
