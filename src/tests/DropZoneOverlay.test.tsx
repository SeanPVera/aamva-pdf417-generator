import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { DropZoneOverlay } from "../components/DropZoneOverlay";
import { ToastProvider } from "../components/Toast";

describe("DropZoneOverlay", () => {
  it("renders overlay on window dragenter with files and hides on dragleave", () => {
    render(
      <ToastProvider>
        <DropZoneOverlay />
      </ToastProvider>
    );

    expect(screen.queryByRole("status")).toBeNull();

    act(() => {
      const enterEvent = new Event("dragenter", { bubbles: true, cancelable: true });
      Object.defineProperty(enterEvent, "dataTransfer", {
        value: { types: ["Files"] }
      });
      window.dispatchEvent(enterEvent);
    });

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(screen.getByText("Drop JSON to import")).toBeInTheDocument();

    act(() => {
      const leaveEvent = new Event("dragleave", { bubbles: true, cancelable: true });
      Object.defineProperty(leaveEvent, "dataTransfer", {
        value: { types: ["Files"] }
      });
      window.dispatchEvent(leaveEvent);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });
});
