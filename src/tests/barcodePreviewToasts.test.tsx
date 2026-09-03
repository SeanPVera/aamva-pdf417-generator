import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeAll, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { BarcodePreview } from "../components/BarcodePreview";
// The JSON copy button is disabled until the payload actually decodes, so it
// has to be a real one. Borrowed from the California conformance vector.
import caBaseline from "../core/conformance/vectors/ca-v10-dl-baseline.json";

const PAYLOAD: string = caBaseline.expectedBytes;

// jsdom implements neither of these, and BarcodePreview reaches for both:
// HoloShimmer asks about prefers-reduced-motion, the copy handlers write to
// the clipboard.
const writeText = vi.fn(() => Promise.resolve());

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia;

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true
  });
});

// Before this, copying only flipped the button label to "Copied!" for two
// seconds. A sighted user watching the button saw it; nobody else did. The
// toast carries role="status", so it is announced.
describe("BarcodePreview — clipboard toasts", () => {
  test("copying the decoded JSON announces it", async () => {
    render(
      <ToastProvider>
        <BarcodePreview payload={PAYLOAD} error={null} stale={false} />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: "Copy decoded payload as JSON" });
    button.click();

    await waitFor(() => {
      expect(screen.getByText("Copied decoded JSON to clipboard")).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
