import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../components/Header";
import { ToastProvider } from "../components/Toast";

describe("Header component micro-UX and accessibility", () => {
  const dummyProps = {
    onStartScan: vi.fn(),
    onOpenShortcuts: vi.fn(),
    onOpenCompare: vi.fn(),
    onOpenBatch: vi.fn()
  };

  function renderHeader() {
    return render(
      <ToastProvider>
        <Header {...dummyProps} />
      </ToastProvider>
    );
  }

  it("provides informative title tooltips on tools menu options", () => {
    renderHeader();

    const toolsButton = screen.getByRole("button", { name: /Tools/i });
    fireEvent.click(toolsButton);

    const exportBtn = screen.getByRole("button", { name: /Export record JSON/i });
    expect(exportBtn).toHaveAttribute("title", "Save current workspace record as a JSON file");
    expect(exportBtn).toHaveAttribute("type", "button");

    const compareBtn = screen.getByRole("button", { name: /Compare payloads/i });
    expect(compareBtn).toHaveAttribute("title", "Side-by-side payload comparison tool");
    expect(compareBtn).toHaveAttribute("type", "button");

    const batchBtn = screen.getByRole("button", { name: /Batch CSV processing/i });
    expect(batchBtn).toHaveAttribute("title", "Process multiple records from a CSV file");
    expect(batchBtn).toHaveAttribute("type", "button");

    const shortcutsBtn = screen.getByRole("button", { name: /Keyboard shortcuts & help/i });
    expect(shortcutsBtn).toHaveAttribute("title", "View keyboard shortcuts and documentation");
    expect(shortcutsBtn).toHaveAttribute("type", "button");

    const eraseMenuBtn = screen.getByRole("button", { name: /Erase record & history…/i });
    expect(eraseMenuBtn).toHaveAttribute("title", "Clear all fields and reset workspace state");
    expect(eraseMenuBtn).toHaveAttribute("type", "button");
  });

  it("supports backdrop click dismissal on EraseDialog", () => {
    renderHeader();

    const toolsButton = screen.getByRole("button", { name: /Tools/i });
    fireEvent.click(toolsButton);

    const eraseMenuBtn = screen.getByRole("button", { name: /Erase record & history…/i });
    fireEvent.click(eraseMenuBtn);

    const dialog = screen.getByRole("dialog", { name: /Erase this record\?/i });
    expect(dialog).toBeInTheDocument();

    const backdrop = dialog.parentElement;
    expect(backdrop).toHaveClass("modal-backdrop");

    // Clicking the backdrop triggers cancellation and closes the dialog
    fireEvent.click(backdrop!);

    expect(screen.queryByRole("dialog", { name: /Erase this record\?/i })).not.toBeInTheDocument();
  });
});
