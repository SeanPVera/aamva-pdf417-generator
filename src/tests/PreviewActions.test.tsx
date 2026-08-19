import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { PreviewActions } from "../components/PreviewActions";
import type { ClerkVoice } from "../hooks/useClerkVoice";
import type { DecodeResult } from "../core/decoder";

const mockDecoded: DecodeResult = {
  raw: "ANSI...",
  json: { DCS: "PUBLIC", DAC: "JOHN" },
  header: {
    fileType: "ANSI ",
    issuerIdentificationNumber: "636000",
    aamvaVersionNumber: "10",
    jurisdictionVersionNumber: "00",
    numberOfEntries: "01"
  },
  subfiles: []
};

const defaultVoice: ClerkVoice = {
  speaking: false,
  supported: true,
  speak: vi.fn(),
  stop: vi.fn()
};

function renderPreviewActions(overrides: Partial<React.ComponentProps<typeof PreviewActions>> = {}) {
  const defaultProps = {
    canExport: true,
    handleExportPNG: vi.fn(),
    handleExportSVG: vi.fn(),
    handleExportPDF: vi.fn(),
    handlePrint: vi.fn(),
    includeNameInExport: false,
    setIncludeNameInExport: vi.fn(),
    exportBasename: (prefix: string) => `${prefix}_test`,
    canCopyImage: true,
    handleCopyImage: vi.fn(),
    imgCopied: false,
    handleCopyJson: vi.fn(),
    jsonCopied: false,
    decoded: mockDecoded,
    stale: false,
    whimsy: true,
    voice: defaultVoice,
    ...overrides
  };

  return render(<PreviewActions {...defaultProps} />);
}

describe("PreviewActions — speech button accessibility", () => {
  test("renders read aloud button with correct initial aria and title attributes when not speaking", () => {
    renderPreviewActions({
      voice: { ...defaultVoice, speaking: false }
    });

    const button = screen.getByRole("button", { name: "Read decoded payload aloud" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("title", "Have the clerk read the payload back to you");
    expect(button).toHaveTextContent("Read it back to me");
  });

  test("renders stop reading button with aria-pressed='true' and dynamic title when speaking", () => {
    renderPreviewActions({
      voice: { ...defaultVoice, speaking: true }
    });

    const button = screen.getByRole("button", { name: "Stop reading payload aloud" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("title", "Stop reading payload aloud");
    expect(button).toHaveTextContent("Stop reading");
  });

  test("triggers voice.speak when clicked while not speaking", () => {
    const speak = vi.fn();
    renderPreviewActions({
      voice: { ...defaultVoice, speaking: false, speak }
    });

    const button = screen.getByRole("button", { name: "Read decoded payload aloud" });
    fireEvent.click(button);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  test("triggers voice.stop when clicked while speaking", () => {
    const stop = vi.fn();
    renderPreviewActions({
      voice: { ...defaultVoice, speaking: true, stop }
    });

    const button = screen.getByRole("button", { name: "Stop reading payload aloud" });
    fireEvent.click(button);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
