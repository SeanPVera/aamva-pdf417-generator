import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepRail, type StepRailSection } from "../components/StepRail";

function section(over: Partial<StepRailSection> = {}): StepRailSection {
  return {
    id: "identity",
    label: "Identity",
    total: 9,
    requiredTotal: 7,
    requiredFilled: 0,
    errors: 0,
    advisories: 0,
    ...over
  };
}

describe("StepRail", () => {
  it("words an untouched section as work remaining, never as failure", () => {
    render(<StepRail sections={[section()]} active="identity" onSelect={() => {}} />);
    expect(screen.getByText("0 of 7 filled")).toBeInTheDocument();
    expect(screen.queryByText(/to fix/)).not.toBeInTheDocument();
  });

  it("reports values the validator rejects as things to fix", () => {
    render(
      <StepRail
        sections={[section({ requiredFilled: 7, errors: 2 })]}
        active="identity"
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("2 to fix")).toBeInTheDocument();
  });

  it("does not call a section done while a value is still wrong", () => {
    // Every required box has something in it, but one of those somethings is
    // invalid. "Done" here would send the user past a section that blocks
    // generation.
    render(
      <StepRail
        sections={[section({ requiredFilled: 7, errors: 1 })]}
        active="identity"
        onSelect={() => {}}
      />
    );
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
    expect(screen.getByText("1 to fix")).toBeInTheDocument();
  });

  it("calls a fully filled, error-free section done", () => {
    render(
      <StepRail sections={[section({ requiredFilled: 7 })]} active="identity" onSelect={() => {}} />
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("separates advisories from errors on a filled section", () => {
    render(
      <StepRail
        sections={[section({ requiredFilled: 7, advisories: 1 })]}
        active="identity"
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("1 to check")).toBeInTheDocument();
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("says a section with no required fields is all optional", () => {
    render(
      <StepRail
        sections={[section({ requiredTotal: 0, total: 4 })]}
        active="identity"
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("All optional")).toBeInTheDocument();
  });

  it("marks the open section as the current step", () => {
    render(
      <StepRail
        sections={[section(), section({ id: "address", label: "Address" })]}
        active="address"
        onSelect={() => {}}
      />
    );
    const current = screen.getByRole("button", { current: "step" });
    expect(current).toHaveTextContent("Address");
  });

  it("selects a section when its rung is pressed", async () => {
    const onSelect = vi.fn();
    render(
      <StepRail
        sections={[section(), section({ id: "address", label: "Address" })]}
        active="identity"
        onSelect={onSelect}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /Address/ }));
    expect(onSelect).toHaveBeenCalledWith("address");
  });

  it("keeps the state readable when the strip has no room to print it", () => {
    // The horizontal phone strip shows only the section name, so the detail
    // line has to reach a screen reader some other way or the state is lost.
    render(
      <StepRail
        sections={[section({ requiredFilled: 7, errors: 3 })]}
        active="identity"
        onSelect={() => {}}
        orientation="horizontal"
      />
    );
    expect(screen.getByRole("button", { name: /Identity/ })).toHaveTextContent("3 to fix");
  });
});
