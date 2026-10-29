import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "../components/Header";
import { ToastProvider } from "../components/Toast";

describe("Header component", () => {
  it("renders buttons with explicit type='button'", () => {
    const dummyScan = vi.fn();
    const dummyShortcuts = vi.fn();
    const dummyCompare = vi.fn();
    const dummyBatch = vi.fn();

    render(
      <ToastProvider>
        <Header
          onStartScan={dummyScan}
          onOpenShortcuts={dummyShortcuts}
          onOpenCompare={dummyCompare}
          onOpenBatch={dummyBatch}
        />
      </ToastProvider>
    );

    const importButton = screen.getByRole("button", { name: /Import/i });
    expect(importButton).toHaveAttribute("type", "button");

    const scanButton = screen.getByRole("button", { name: /Scan barcode/i });
    expect(scanButton).toHaveAttribute("type", "button");
  });
});
