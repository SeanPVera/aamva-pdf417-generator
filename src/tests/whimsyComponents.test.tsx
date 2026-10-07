import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { TicketDispenser } from "../components/TicketDispenser";
import { ClerkMascot } from "../components/ClerkMascot";
import { EmployeeOfTheMonth } from "../components/EmployeeOfTheMonth";

describe("Overlay components dismiss button accessibility", () => {
  it("TicketDispenser dismiss button has aria-label, matching title, and focus visible styles", () => {
    render(<TicketDispenser enabled={true} served={1} />);
    const button = screen.getByRole("button", { name: "Hide the queue ticket" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Hide the queue ticket");
    expect(button.className).toContain("focus-visible:ring-2");
  });

  it("ClerkMascot dismiss button has aria-label, matching title, and focus visible styles", () => {
    render(<ClerkMascot enabled={true} errorCount={0} requiredComplete={false} anyFields={true} />);
    const button = screen.getByRole("button", { name: "Hide the clerk mascot" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Hide the clerk mascot");
    expect(button.className).toContain("focus-visible:ring-2");
  });

  it("EmployeeOfTheMonth close button has matching title tooltip", () => {
    render(
      <EmployeeOfTheMonth
        open={true}
        onClose={() => {}}
        stats={{
          visitedStates: new Set(["CA"]),
          barcodesGenerated: 1,
          undosPressed: 0,
          presetsUsed: 0,
          customThemesUsed: 0,
          roadTestPassed: false
        }}
      />
    );
    const button = screen.getByRole("button", { name: "Close the plaque" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Close the plaque");
  });
});
