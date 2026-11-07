import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import React from "react";
import { BarcodeCanvas } from "../components/BarcodeCanvas";

describe("BarcodeCanvas Component", () => {
  const defaultDims = { widthInches: 2.75, heightInches: 1.0 };

  test("renders empty state with accessible jump button and attributes", () => {
    const scrollToField = vi.fn();
    render(
      <BarcodeCanvas
        canvasRef={{ current: null }}
        zoom={1}
        setZoom={vi.fn()}
        stale={false}
        success={false}
        error={null}
        whimsy={false}
        state="CA"
        emptyRequired={[{ code: "DCS" }]}
        issues={[]}
        scrollToField={scrollToField}
        dims={defaultDims}
        exportDpi={300}
      />
    );

    const jumpButton = screen.getByRole("button", { name: "Go to DCS →" });
    expect(jumpButton).toBeInTheDocument();
    expect(jumpButton).toHaveAttribute("type", "button");
    expect(jumpButton).toHaveAttribute("title", "Jump to field DCS");
    expect(jumpButton).toHaveClass("focus-visible:ring-2");
    expect(jumpButton).toHaveClass("focus-visible:ring-brand-500");

    fireEvent.click(jumpButton);
    expect(scrollToField).toHaveBeenCalledWith("DCS");
  });

  test("renders zoom controls with accessible attributes, titles, and focus states", () => {
    const setZoom = vi.fn();
    const { rerender } = render(
      <BarcodeCanvas
        canvasRef={{ current: null }}
        zoom={1}
        setZoom={setZoom}
        stale={false}
        success={true}
        error={null}
        whimsy={false}
        state="CA"
        emptyRequired={[]}
        issues={[]}
        scrollToField={vi.fn()}
        dims={defaultDims}
        exportDpi={300}
      />
    );

    const zoomOutButton = screen.getByRole("button", { name: "Zoom out" });
    const zoomInButton = screen.getByRole("button", { name: "Zoom in" });

    expect(zoomOutButton).toBeInTheDocument();
    expect(zoomOutButton).toHaveAttribute("type", "button");
    expect(zoomOutButton).toBeDisabled();
    expect(zoomOutButton).toHaveAttribute("title", "Minimum zoom reached");
    expect(zoomOutButton).toHaveClass("focus-visible:ring-2");
    expect(zoomOutButton).toHaveClass("focus-visible:ring-brand-500");

    expect(zoomInButton).toBeInTheDocument();
    expect(zoomInButton).toHaveAttribute("type", "button");
    expect(zoomInButton).not.toBeDisabled();
    expect(zoomInButton).toHaveAttribute("title", "Zoom in");
    expect(zoomInButton).toHaveClass("focus-visible:ring-2");
    expect(zoomInButton).toHaveClass("focus-visible:ring-brand-500");

    // Test zoom at maximum (zoom = 3)
    rerender(
      <BarcodeCanvas
        canvasRef={{ current: null }}
        zoom={3}
        setZoom={setZoom}
        stale={false}
        success={true}
        error={null}
        whimsy={false}
        state="CA"
        emptyRequired={[]}
        issues={[]}
        scrollToField={vi.fn()}
        dims={defaultDims}
        exportDpi={300}
      />
    );

    expect(zoomInButton).toBeDisabled();
    expect(zoomInButton).toHaveAttribute("title", "Maximum zoom reached");
    expect(zoomOutButton).not.toBeDisabled();
    expect(zoomOutButton).toHaveAttribute("title", "Zoom out");
  });
});
