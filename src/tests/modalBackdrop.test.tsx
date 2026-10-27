import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImportRecordDialog } from "../components/ImportRecordDialog";
import { WebcamScanner } from "../components/WebcamScanner";
import { Header } from "../components/Header";
import { ToastProvider } from "../components/Toast";

// Mock @zxing/browser so WebcamScanner can mount in jsdom without issues
vi.mock("@zxing/browser", () => {
  const mockReader = vi.fn().mockImplementation(function () {
    return {
      decodeFromVideoDevice: vi.fn().mockResolvedValue({ stop: vi.fn() }),
      decodeFromImageUrl: vi.fn()
    };
  });
  (mockReader as any).listVideoInputDevices = vi.fn().mockResolvedValue([]);
  return {
    BrowserPDF417Reader: mockReader
  };
});

describe("Modal Backdrop Click Dismissal", () => {
  it("dismisses ImportRecordDialog when clicking backdrop, but not content", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <ToastProvider>
        <ImportRecordDialog onClose={handleClose} />
      </ToastProvider>
    );

    const dialogContent = screen.getByRole("dialog");
    const backdrop = container.querySelector(".modal-backdrop");
    expect(backdrop).not.toBeNull();

    // Click inside dialog panel
    fireEvent.click(dialogContent);
    expect(handleClose).not.toHaveBeenCalled();

    // Click backdrop
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses WebcamScanner when clicking backdrop, but not content", async () => {
    const handleClose = vi.fn();
    let container: HTMLElement;
    await React.act(async () => {
      const res = render(
        <ToastProvider>
          <WebcamScanner onClose={handleClose} />
        </ToastProvider>
      );
      container = res.container;
    });

    const dialogContent = screen.getByRole("dialog");
    const backdrop = container!.querySelector(".modal-backdrop");
    expect(backdrop).not.toBeNull();

    // Click inside dialog panel
    fireEvent.click(dialogContent);
    expect(handleClose).not.toHaveBeenCalled();

    // Click backdrop
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses EraseDialog in Header when clicking backdrop, but not content", () => {
    const { container } = render(
      <ToastProvider>
        <Header
          onStartScan={vi.fn()}
          onOpenShortcuts={vi.fn()}
          onOpenCompare={vi.fn()}
          onOpenBatch={vi.fn()}
        />
      </ToastProvider>
    );

    // Open tools menu
    const toolsBtn = screen.getByRole("button", { name: /Tools/i });
    fireEvent.click(toolsBtn);

    // Click "Erase record & history…"
    const eraseTrigger = screen.getByText(/Erase record & history…/i);
    fireEvent.click(eraseTrigger);

    // Erase dialog is now visible
    const dialogContent = screen.getByRole("dialog");
    const backdrop = container.querySelector(".modal-backdrop");
    expect(backdrop).not.toBeNull();

    // Click inside erase dialog panel
    fireEvent.click(dialogContent);
    expect(screen.queryByRole("dialog")).not.toBeNull();

    // Click backdrop
    fireEvent.click(backdrop!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
