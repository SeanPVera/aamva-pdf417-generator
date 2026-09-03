import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { PreviewActions } from "../components/PreviewActions";
import type { ClerkVoice } from "../hooks/useClerkVoice";
import type { DecodeResult } from "../core/decoder";

const decoded: DecodeResult = {
  ok: true,
  json: { DCS: "PUBLIC", DAC: "JOHN" },
  subfiles: ["DL"]
};

const silentVoice: ClerkVoice = {
  supported: true,
  speaking: false,
  speak: vi.fn(),
  stop: vi.fn()
};

function renderActions(overrides: Partial<React.ComponentProps<typeof PreviewActions>> = {}) {
  return render(
    <PreviewActions
      canExport
      handleExportPNG={vi.fn()}
      handleExportSVG={vi.fn()}
      handleExportPDF={vi.fn()}
      handlePrint={vi.fn()}
      includeNameInExport={false}
      setIncludeNameInExport={vi.fn()}
      exportBasename={(prefix) => `${prefix}_test`}
      canCopyImage
      handleCopyImage={vi.fn()}
      imgCopied={false}
      handleCopyJson={vi.fn()}
      jsonCopied={false}
      decoded={decoded}
      stale={false}
      whimsy={false}
      voice={silentVoice}
      {...overrides}
    />
  );
}

describe("PreviewActions", () => {
  test("every export and copy action is reachable by its accessible name", () => {
    renderActions();

    for (const name of [
      "Export barcode as PNG",
      "Export barcode as SVG",
      "Export barcode as PDF",
      "Print barcode",
      "Copy barcode image to clipboard",
      "Copy decoded payload as JSON"
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  test("the copy buttons call their handlers", () => {
    const handleCopyImage = vi.fn();
    const handleCopyJson = vi.fn();
    renderActions({ handleCopyImage, handleCopyJson });

    fireEvent.click(screen.getByRole("button", { name: "Copy barcode image to clipboard" }));
    expect(handleCopyImage).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Copy decoded payload as JSON" }));
    expect(handleCopyJson).toHaveBeenCalledTimes(1);
  });
});

// The button is a toggle, so a screen reader needs aria-pressed to say which
// half of it is live. Its label has to change too: "Read it back to me" while
// it is speaking would name the action it no longer performs.
describe("PreviewActions — the read-aloud toggle", () => {
  test("announces itself as unpressed and offers to read while idle", () => {
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: false } });

    const button = screen.getByRole("button", { name: "Read decoded payload aloud" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("title", "Have the clerk read the payload back to you");
    expect(button).toHaveTextContent("Read it back to me");
  });

  test("announces itself as pressed and offers to stop while speaking", () => {
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: true } });

    const button = screen.getByRole("button", { name: "Stop reading payload aloud" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("title", "Stop reading payload aloud");
    expect(button).toHaveTextContent("Stop reading");
  });

  test("speaks when idle and stops when speaking", () => {
    const speak = vi.fn();
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: false, speak } });
    fireEvent.click(screen.getByRole("button", { name: "Read decoded payload aloud" }));
    expect(speak).toHaveBeenCalledTimes(1);

    const stop = vi.fn();
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: true, stop } });
    fireEvent.click(screen.getByRole("button", { name: "Stop reading payload aloud" }));
    expect(stop).toHaveBeenCalledTimes(1);
  });

  // It is one of the playful flourishes, so it is gated on all three of
  // whimsy, speech support, and something actually decoded to read.
  test.each([
    ["whimsy is off", { whimsy: false }],
    ["speech is unsupported", { whimsy: true, voice: { ...silentVoice, supported: false } }],
    ["nothing decoded", { whimsy: true, decoded: null }]
  ])("is absent when %s", (_label, overrides) => {
    renderActions(overrides);
    expect(screen.queryByRole("button", { name: /payload aloud/ })).not.toBeInTheDocument();
  });
});
