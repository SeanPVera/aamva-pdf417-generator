import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MobileActionBar } from "../components/MobileActionBar";

describe("MobileActionBar UX & Tooltips", () => {
  it("renders panel navigation buttons with informative title tooltips", () => {
    render(
      <MobileActionBar
        panel="form"
        onPanelChange={() => {}}
        errorCount={0}
        emptyRequired={0}
        stale={false}
        ready={true}
        onFixNext={() => {}}
        onExport={() => {}}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Mobile panels" });

    const setupBtn = within(nav).getByRole("button", { name: /Setup/i });
    expect(setupBtn).toHaveAttribute("title", "Switch to Setup panel");

    const formBtn = within(nav).getByRole("button", { name: /Form/i });
    expect(formBtn).toHaveAttribute("title", "Switch to Form panel");

    const barcodeBtn = within(nav).getByRole("button", { name: /Barcode/i });
    expect(barcodeBtn).toHaveAttribute("title", "Switch to Barcode panel");
  });

  it("displays correct title tooltip for Fix button when errors exist", () => {
    const handleFix = vi.fn();
    render(
      <MobileActionBar
        panel="form"
        onPanelChange={() => {}}
        errorCount={2}
        emptyRequired={0}
        stale={false}
        ready={false}
        onFixNext={handleFix}
        onExport={() => {}}
      />
    );

    const fixBtn = screen.getByRole("button", { name: /Fix/i });
    expect(fixBtn).toHaveAttribute("title", "Jump to next validation error");

    fireEvent.click(fixBtn);
    expect(handleFix).toHaveBeenCalledTimes(1);
  });

  it("displays correct title tooltip for Next button when required fields are empty", () => {
    render(
      <MobileActionBar
        panel="form"
        onPanelChange={() => {}}
        errorCount={0}
        emptyRequired={3}
        stale={false}
        ready={false}
        onFixNext={() => {}}
        onExport={() => {}}
      />
    );

    const nextBtn = screen.getByRole("button", { name: /Next/i });
    expect(nextBtn).toHaveAttribute("title", "Jump to next empty required field");
  });

  it("displays title tooltip and aria-label for PNG quick export button", () => {
    const handleExport = vi.fn();
    render(
      <MobileActionBar
        panel="preview"
        onPanelChange={() => {}}
        errorCount={0}
        emptyRequired={0}
        stale={false}
        ready={true}
        onFixNext={() => {}}
        onExport={handleExport}
      />
    );

    const exportBtn = screen.getByRole("button", { name: /Quick export barcode as PNG/i });
    expect(exportBtn).toHaveAttribute("title", "Quick export barcode as PNG");

    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);
  });
});
