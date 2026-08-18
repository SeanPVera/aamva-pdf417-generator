import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PreviewActions } from "../components/PreviewActions";

describe("PreviewActions", () => {
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
    decoded: {
      ok: true,
      json: { ANSI: "636000010002DL00410278ZT00000000" },
      mapped: [],
      subfiles: []
    },
    stale: false,
    whimsy: false,
    voice: {
      supported: false,
      speaking: false,
      speak: vi.fn(),
      stop: vi.fn()
    }
  };

  it("renders export and copy action buttons", () => {
    render(<PreviewActions {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Export barcode as PNG" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export barcode as SVG" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export barcode as PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print barcode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy barcode image to clipboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy decoded payload as JSON" })).toBeInTheDocument();
  });

  it("calls handleCopyImage when copy image button is clicked", () => {
    const handleCopyImage = vi.fn();
    render(<PreviewActions {...defaultProps} handleCopyImage={handleCopyImage} />);

    const copyImageBtn = screen.getByRole("button", { name: "Copy barcode image to clipboard" });
    fireEvent.click(copyImageBtn);

    expect(handleCopyImage).toHaveBeenCalledTimes(1);
  });

  it("calls handleCopyJson when copy JSON button is clicked", () => {
    const handleCopyJson = vi.fn();
    render(<PreviewActions {...defaultProps} handleCopyJson={handleCopyJson} />);

    const copyJsonBtn = screen.getByRole("button", { name: "Copy decoded payload as JSON" });
    fireEvent.click(copyJsonBtn);

    expect(handleCopyJson).toHaveBeenCalledTimes(1);
  });
});
