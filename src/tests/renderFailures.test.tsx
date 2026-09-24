import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BarcodePreview } from "../components/BarcodePreview";
import { ToastProvider } from "../components/Toast";
import ca from "../core/conformance/vectors/ca-v10-dl-baseline.json";
const renderer = vi.hoisted(() => ({ toCanvas: vi.fn(), toSVG: vi.fn() }));
const download = vi.hoisted(() => ({ downloadUrl: vi.fn(), downloadBlob: vi.fn() }));
vi.mock("bwip-js", () => ({ default: renderer }));
vi.mock("../core/download", () => download);
function preview() {
  return render(
    <ToastProvider>
      <BarcodePreview payload={ca.expectedBytes} error={null} stale={false} whimsy={false} />
    </ToastProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn()
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AA==");
  renderer.toCanvas.mockImplementation((canvas: HTMLCanvasElement) => {
    canvas.width = 600;
    canvas.height = 200;
  });
});
describe("barcode output failure boundaries", () => {
  it("does not mark a failed render as ready or offer image exports", async () => {
    renderer.toCanvas.mockImplementation(() => {
      throw new Error("symbol capacity exceeded");
    });
    preview();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Export barcode as PNG" })).toBeDisabled()
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/could not render/i);
    expect(screen.queryByText("Rendered · ready to export")).not.toBeInTheDocument();
  });
  it("reports failed SVG encoding without disguising a bitmap as vector output", async () => {
    renderer.toSVG.mockImplementation(() => {
      throw new Error("capacity");
    });
    preview();
    const button = screen.getByRole("button", { name: "Export barcode as SVG" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(download.downloadBlob).not.toHaveBeenCalled();
    expect(await screen.findByText(/could not export svg/i)).toBeInTheDocument();
  });
  it("fails visibly when PNG re-encoding fails instead of silently falling back", async () => {
    preview();
    const button = screen.getByRole("button", { name: "Export barcode as PNG" });
    await waitFor(() => expect(button).toBeEnabled());
    renderer.toCanvas.mockImplementation(() => {
      throw new Error("capacity");
    });
    fireEvent.click(button);
    expect(download.downloadUrl).not.toHaveBeenCalled();
    expect(await screen.findByText(/could not export png/i)).toBeInTheDocument();
  });
});
