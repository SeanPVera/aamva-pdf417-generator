import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { WebcamScanner } from "../components/WebcamScanner";
import { BrowserPDF417Reader } from "@zxing/browser";
import { useFormStore } from "../hooks/useFormStore";
import { ToastProvider } from "../components/Toast";

// Mock lucide-react to avoid importing SVGs in tests if they cause issues
vi.mock("lucide-react", () => {
  return {
    Camera: () => <div data-testid="icon-camera" />,
    X: () => <div data-testid="icon-x" />,
    AlertTriangle: () => <div data-testid="icon-alert" />,
    ImagePlus: () => <div data-testid="icon-image" />,
    Video: () => <div data-testid="icon-video" />,
    FlipHorizontal2: () => <div data-testid="icon-flip" />,
    Flashlight: () => <div data-testid="icon-flash" />,
    FlashlightOff: () => <div data-testid="icon-flash-off" />,
    CheckCircle2: () => <div data-testid="icon-check2" />,
    XCircle: () => <div data-testid="icon-xcircle" />,
    Info: () => <div data-testid="icon-info" />,
    Loader2: () => <div data-testid="icon-loader" />,
    CheckCircle: () => <div data-testid="icon-check" />,
    AlertCircle: () => <div data-testid="icon-alertcircle" />
  };
});

// Mock decodeAAMVA
vi.mock("../core/decoder", () => ({
  decodeAAMVA: vi.fn((text) => {
    if (text === "valid_payload") {
      return { ok: true, json: { state: "CA", version: 1 } };
    }
    return { ok: false, error: "invalid" };
  })
}));

// Mock zxing browser reader
vi.mock("@zxing/browser", () => {
  const mockReader = vi.fn().mockImplementation(function () {
    return {
      decodeFromVideoDevice: vi.fn(),
      decodeFromImageUrl: vi.fn()
    };
  });
  return {
    BrowserPDF417Reader: mockReader
  };
});

const renderWithToast = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe("WebcamScanner", () => {
  const mockOnClose = vi.fn();
  const mockLoadJson = vi.fn();
  const mockSetStateVersion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup global URL mocks
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock useFormStore
    useFormStore.setState({
      loadJson: mockLoadJson,
      setStateVersion: mockSetStateVersion
    });
  });

  it("renders correctly and attempts to list video devices", async () => {
    // Mock the static listVideoInputDevices
    (BrowserPDF417Reader as any).listVideoInputDevices = vi.fn().mockResolvedValue([
      { deviceId: "cam1", label: "Front Camera" },
      { deviceId: "cam2", label: "Back Camera" }
    ]);

    await act(async () => {
      renderWithToast(<WebcamScanner onClose={mockOnClose} />);
    });

    // Check title
    expect(screen.getByText("Scan DL/ID Barcode")).toBeInTheDocument();

    // Ensure camera selector is shown after devices load
    await waitFor(() => {
      expect(screen.getByLabelText("Camera:")).toBeInTheDocument();
    });

    const select = screen.getByLabelText("Camera:");
    expect(select.childNodes).toHaveLength(2);
    expect(select).toHaveValue("cam2"); // defaults to last camera usually
  });

  it("calls onClose when the close button is clicked", async () => {
    (BrowserPDF417Reader as any).listVideoInputDevices = vi.fn().mockResolvedValue([]);
    await act(async () => {
      renderWithToast(<WebcamScanner onClose={mockOnClose} />);
    });

    const closeBtn = screen.getByLabelText("Close scanner");
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles image file selection", async () => {
    (BrowserPDF417Reader as any).listVideoInputDevices = vi.fn().mockResolvedValue([]);
    const decodeFromImageUrlMock = vi.fn().mockResolvedValue({
      getText: () => "valid_payload"
    });

    // Override the instance mock for this test using mockImplementationOnce
    (BrowserPDF417Reader as any).mockImplementationOnce(function () {
      return {
        decodeFromImageUrl: decodeFromImageUrlMock,
        decodeFromVideoDevice: vi.fn()
      };
    });

    await act(async () => {
      renderWithToast(<WebcamScanner onClose={mockOnClose} />);
    });

    const fileInput = screen.getByLabelText("Select image for barcode scanning");
    const file = new File(["dummy content"], "barcode.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(decodeFromImageUrlMock).toHaveBeenCalledWith("blob:mock-url");
    });

    // After successful decode with "valid_payload"
    expect(mockLoadJson).toHaveBeenCalledWith({ state: "CA", version: 1 });
    expect(mockSetStateVersion).toHaveBeenCalledWith("CA", 1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays an error when image scanning fails", async () => {
    (BrowserPDF417Reader as any).listVideoInputDevices = vi.fn().mockResolvedValue([]);
    const decodeFromImageUrlMock = vi.fn().mockRejectedValue(new Error("No barcode"));

    (BrowserPDF417Reader as any).mockImplementationOnce(function () {
      return {
        decodeFromImageUrl: decodeFromImageUrlMock,
        decodeFromVideoDevice: vi.fn()
      };
    });

    await act(async () => {
      renderWithToast(<WebcamScanner onClose={mockOnClose} />);
    });

    const fileInput = screen.getByLabelText("Select image for barcode scanning");
    const file = new File(["dummy content"], "barcode.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Could not find a readable PDF417 barcode in the selected image.")
      ).toBeInTheDocument();
    });
  });

  it("displays an error message if video device access fails", async () => {
    (BrowserPDF417Reader as any).listVideoInputDevices = vi
      .fn()
      .mockResolvedValue([{ deviceId: "cam1", label: "Cam 1" }]);
    const mockError = new Error("Not allowed");
    mockError.name = "NotAllowedError";
    const decodeFromVideoDeviceMock = vi.fn().mockRejectedValue(mockError);

    (BrowserPDF417Reader as any).mockImplementation(function () {
      return {
        decodeFromVideoDevice: decodeFromVideoDeviceMock,
        decodeFromImageUrl: vi.fn()
      };
    });

    await act(async () => {
      renderWithToast(<WebcamScanner onClose={mockOnClose} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Camera access was blocked/)).toBeInTheDocument();
    });
  });
});
