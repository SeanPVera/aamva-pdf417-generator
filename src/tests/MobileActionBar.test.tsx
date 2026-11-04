import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileActionBar } from "../components/MobileActionBar";

function renderBar(overrides: Partial<React.ComponentProps<typeof MobileActionBar>> = {}) {
  const props = {
    panel: "form" as const,
    onPanelChange: vi.fn(),
    errorCount: 0,
    emptyRequired: 0,
    stale: false,
    ready: true,
    onFixNext: vi.fn(),
    onExport: vi.fn(),
    ...overrides
  };
  return { ...render(<MobileActionBar {...props} />), props };
}

describe("MobileActionBar", () => {
  it("navigates panels while marking the current panel", () => {
    const { props } = renderBar();
    expect(screen.getByRole("button", { name: "Form" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Setup" }));
    expect(props.onPanelChange).toHaveBeenCalledWith("config");
    fireEvent.click(screen.getByRole("button", { name: /Barcode/ }));
    expect(props.onPanelChange).toHaveBeenCalledWith("preview");
  });

  it.each([
    [2, 0, "Fix errors: jump to the next validation error", "Fix errors"],
    [0, 3, "Next field: jump to the next empty required field", "Next field"]
  ])("explains the next action when errors=%s and empty=%s", (errors, empty, name, label) => {
    const { props } = renderBar({ errorCount: errors, emptyRequired: empty, ready: false });
    const button = screen.getByRole("button", { name });
    expect(button).toHaveTextContent(label);
    fireEvent.click(button);
    expect(props.onFixNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Quick export/ })).not.toBeInTheDocument();
  });

  it("exports only when a current barcode is ready", () => {
    const { props, rerender } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Quick export barcode as PNG" }));
    expect(props.onExport).toHaveBeenCalledTimes(1);
    rerender(<MobileActionBar {...props} stale />);
    expect(screen.getByText("Encoding")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quick export/ })).not.toBeInTheDocument();
    rerender(<MobileActionBar {...props} ready={false} />);
    expect(screen.getByRole("button", { name: /Quick export/ })).toBeDisabled();
  });
});
