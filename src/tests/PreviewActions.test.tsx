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

// It is a command button that swaps commands, not a toggle: the visible text
// names the action, and the accessible name comes from that text. aria-pressed
// alongside a changing name would announce as "Stop reading, pressed", which
// does not say whether reading or stopping is live.
describe("PreviewActions — the read-aloud button", () => {
  test("offers to read, and describes that, while idle", () => {
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: false } });

    const button = screen.getByRole("button", { name: "Read it back to me" });
    expect(button).toHaveAttribute("title", "Have the clerk read the payload back to you");
  });

  test("offers to stop, and describes that, while speaking", () => {
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: true } });

    const button = screen.getByRole("button", { name: "Stop reading" });
    expect(button).toHaveAttribute("title", "Stop reading the payload aloud");
  });

  // Label in Name (WCAG 2.5.3): a speech-input user says what they can see.
  test.each([
    [false, "Read it back to me"],
    [true, "Stop reading"]
  ])("its accessible name is the visible text (speaking=%s)", (speaking, visible) => {
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking } });

    const button = screen.getByRole("button", { name: visible });
    expect(button).toHaveTextContent(visible);
    expect(button).not.toHaveAttribute("aria-label");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  test("speaks when idle and stops when speaking", () => {
    const speak = vi.fn();
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: false, speak } });
    fireEvent.click(screen.getByRole("button", { name: "Read it back to me" }));
    expect(speak).toHaveBeenCalledTimes(1);

    const stop = vi.fn();
    renderActions({ whimsy: true, voice: { ...silentVoice, speaking: true, stop } });
    fireEvent.click(screen.getByRole("button", { name: "Stop reading" }));
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
    expect(
      screen.queryByRole("button", { name: /read it back|stop reading/i })
    ).not.toBeInTheDocument();
  });
});
