import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { WebcamScanner } from "../components/WebcamScanner";
import { useFormStore } from "../hooks/useFormStore";
import { ToastProvider } from "../components/Toast";

const mocks = vi.hoisted(() => ({
  scanFrame: vi.fn(),
  scanStill: vi.fn(),
  grabGrayFrame: vi.fn(),
  loadImage: vi.fn(),
  createNativePdf417Detector: vi.fn()
}));

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

vi.mock("../core/decoder", () => ({
  decodeAAMVA: vi.fn((text) => {
    if (text === "valid_payload") {
      return { ok: true, json: { state: "CA", version: "10" } };
    }
    if (text === "unsupported_version_payload") {
      return { ok: true, json: { state: "CA", version: "99" } };
    }
    return { ok: false, error: "invalid" };
  })
}));

// The pixel pipeline has its own suite (scanPipeline.test.ts); here it is a
// switch the test flips to say "this frame decoded".
vi.mock("../core/scanPipeline", () => ({
  createFrameScanner: () => mocks.scanFrame,
  scanStill: mocks.scanStill,
  rgbaToGray: vi.fn()
}));

// Camera opening, listing and error wording stay real — they are what broke.
// Only the canvas and image decoding, which jsdom lacks, are stubbed.
vi.mock("../components/scannerMedia", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../components/scannerMedia")>()),
  grabGrayFrame: mocks.grabGrayFrame,
  loadImage: mocks.loadImage,
  createNativePdf417Detector: mocks.createNativePdf417Detector
}));

const renderWithToast = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

function fakeTrack(deviceId = "rear-cam", capabilities: Record<string, unknown> = {}) {
  return {
    stop: vi.fn(),
    getSettings: () => ({ deviceId }),
    getCapabilities: () => capabilities,
    applyConstraints: vi.fn().mockResolvedValue(undefined)
  };
}

function fakeStream(track = fakeTrack()) {
  return { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
}

const blankCamera = { deviceId: "", groupId: "", kind: "videoinput", label: "" };
const camera = (deviceId: string, label: string) => ({
  deviceId,
  groupId: "",
  kind: "videoinput",
  label
});

let getUserMedia: ReturnType<typeof vi.fn>;
let enumerateDevices: ReturnType<typeof vi.fn>;

function installMediaDevices() {
  getUserMedia = vi.fn().mockResolvedValue(fakeStream());
  // What a browser reports before the user has granted camera access.
  enumerateDevices = vi.fn().mockResolvedValue([blankCamera]);
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia, enumerateDevices },
    configurable: true
  });
}

/** Makes every <video> look like it is showing frames. */
function videoHasFrames() {
  Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
    configurable: true,
    get: () => 4
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
    configurable: true,
    get: () => 1920
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
    configurable: true,
    get: () => 1080
  });
}

function chooseImage() {
  fireEvent.change(screen.getByLabelText("Select image for barcode scanning"), {
    target: { files: [new File(["x"], "barcode.jpg", { type: "image/jpeg" })] }
  });
}

describe("WebcamScanner", () => {
  const mockOnClose = vi.fn();
  const mockLoadJson = vi.fn();
  const mockSetStateVersion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    installMediaDevices();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    mocks.scanFrame.mockReturnValue(null);
    mocks.scanStill.mockResolvedValue(null);
    mocks.grabGrayFrame.mockReturnValue({ data: new Uint8ClampedArray(4), width: 2, height: 2 });
    mocks.loadImage.mockResolvedValue({ naturalWidth: 2, naturalHeight: 2 });
    mocks.createNativePdf417Detector.mockResolvedValue(null);
    useFormStore.setState({
      loadJson: mockLoadJson,
      setStateVersion: mockSetStateVersion,
      cameraDeviceId: ""
    });
  });

  afterEach(() => {
    delete (HTMLMediaElement.prototype as { readyState?: number }).readyState;
    delete (HTMLVideoElement.prototype as { videoWidth?: number }).videoWidth;
    delete (HTMLVideoElement.prototype as { videoHeight?: number }).videoHeight;
    vi.restoreAllMocks();
  });

  describe("starting the camera", () => {
    it("opens the rear camera on a first visit, while every camera still has a blank ID", async () => {
      // The scanner used to wait for a camera ID before opening anything. A
      // browser reports blank IDs until access is granted, and access is only
      // requested by opening a camera — so it never started.
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
      const { video } = getUserMedia.mock.calls[0][0];
      expect(video.facingMode).toEqual({ ideal: "environment" });
      expect(video.deviceId).toBeUndefined();
      // Without a size the browser opens at 640×480, too coarse for a licence barcode.
      expect(video.width).toEqual({ ideal: 1920 });
      expect(video.height).toEqual({ ideal: 1080 });
    });

    it("lists the cameras once access is granted and remembers the one in use", async () => {
      enumerateDevices.mockResolvedValue([
        camera("front-cam", "Front"),
        camera("rear-cam", "Back")
      ]);
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      const select = await screen.findByLabelText("Camera:");
      expect(select.childNodes).toHaveLength(2);
      expect(select).toHaveValue("rear-cam");
      expect(useFormStore.getState().cameraDeviceId).toBe("rear-cam");
    });

    it("asks for the remembered camera, and falls back when it has gone away", async () => {
      useFormStore.setState({ cameraDeviceId: "old-webcam" });
      const gone = Object.assign(new Error("gone"), { name: "OverconstrainedError" });
      getUserMedia.mockRejectedValueOnce(gone).mockResolvedValueOnce(fakeStream());

      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
      expect(getUserMedia.mock.calls[0][0].video.deviceId).toEqual({ exact: "old-webcam" });
      expect(getUserMedia.mock.calls[1][0].video.facingMode).toEqual({ ideal: "environment" });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("switches camera with Flip", async () => {
      enumerateDevices.mockResolvedValue([
        camera("rear-cam", "Back"),
        camera("front-cam", "Front")
      ]);
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      fireEvent.click(await screen.findByLabelText("Flip camera"));
      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
      expect(getUserMedia.mock.calls[1][0].video.deviceId).toEqual({ exact: "front-cam" });
    });

    it("offers the flashlight when the camera has one", async () => {
      getUserMedia.mockResolvedValue(fakeStream(fakeTrack("rear-cam", { torch: true })));
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });
      expect(await screen.findByLabelText("Toggle flashlight")).toBeInTheDocument();
    });

    it("explains that the camera needs a secure page", async () => {
      Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });
      try {
        await act(async () => {
          renderWithToast(<WebcamScanner onClose={mockOnClose} />);
        });
        expect(screen.getByRole("alert")).toHaveTextContent(/secure \(https\) page/);
        expect(getUserMedia).not.toHaveBeenCalled();
      } finally {
        delete (window as { isSecureContext?: boolean }).isSecureContext;
      }
    });

    it("displays an error message if camera access is blocked", async () => {
      getUserMedia.mockRejectedValue(
        Object.assign(new Error("Not allowed"), { name: "NotAllowedError" })
      );
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });
      await waitFor(() => {
        expect(screen.getByText(/Camera access was blocked/)).toBeInTheDocument();
      });
    });

    it("stops the camera when the scanner closes before startup finishes", async () => {
      // getUserMedia can resolve after the modal is gone. The cleanup has
      // already run by then, so the tracks have to be stopped on arrival or
      // the camera indicator stays on for the rest of the session.
      const track = fakeTrack();
      let resolveStart!: (stream: MediaStream) => void;
      getUserMedia.mockReturnValue(new Promise((resolve) => (resolveStart = resolve)));

      let unmount!: () => void;
      await act(async () => {
        ({ unmount } = renderWithToast(<WebcamScanner onClose={mockOnClose} />));
      });
      act(() => unmount());
      await act(async () => {
        resolveStart(fakeStream(track));
      });

      expect(track.stop).toHaveBeenCalledTimes(1);
    });

    it("stops the camera when the scanner closes", async () => {
      const track = fakeTrack();
      getUserMedia.mockResolvedValue(fakeStream(track));
      let unmount!: () => void;
      await act(async () => {
        ({ unmount } = renderWithToast(<WebcamScanner onClose={mockOnClose} />));
      });
      await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
      act(() => unmount());
      expect(track.stop).toHaveBeenCalled();
    });

    it("does not restart the camera when the parent re-renders with a new onClose", async () => {
      // `onClose` comes from an inline arrow function in App.tsx and gets a new
      // identity on every render of a parent that subscribes to the whole form
      // store. If the camera effect depended on it, each of those renders would
      // restart the stream and the scanner would never see a steady picture.
      let rerender!: (ui: React.ReactElement) => void;
      await act(async () => {
        ({ rerender } = renderWithToast(<WebcamScanner onClose={mockOnClose} />));
      });
      await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));

      await act(async () => {
        rerender(<ToastProvider>{<WebcamScanner onClose={() => mockOnClose()} />}</ToastProvider>);
      });

      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe("reading the camera", () => {
    it("keeps reading frames until one decodes, then loads it and closes", async () => {
      videoHasFrames();
      const track = fakeTrack();
      getUserMedia.mockResolvedValue(fakeStream(track));
      mocks.scanFrame
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValue("valid_payload");

      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
      expect(mocks.scanFrame).toHaveBeenCalledTimes(3);
      // The raw bytes ride along for the byte ledger.
      expect(mockLoadJson).toHaveBeenCalledWith({ state: "CA", version: "10" }, "valid_payload");
      expect(mockSetStateVersion).not.toHaveBeenCalled();
      expect(track.stop).toHaveBeenCalled();
    });

    it("keeps scanning after a barcode that is not an AAMVA card", async () => {
      videoHasFrames();
      mocks.scanFrame.mockReturnValueOnce("boarding pass").mockReturnValue("valid_payload");

      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
      expect(mockLoadJson).toHaveBeenCalledTimes(1);
    });

    it("uses the platform barcode reader when there is one", async () => {
      videoHasFrames();
      mocks.createNativePdf417Detector.mockResolvedValue({
        detect: vi.fn().mockResolvedValue("valid_payload")
      });

      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
      expect(mocks.scanFrame).not.toHaveBeenCalled();
    });

    it("falls back to its own reader when the platform reader fails", async () => {
      videoHasFrames();
      mocks.createNativePdf417Detector.mockResolvedValue({
        detect: vi.fn().mockRejectedValue(new Error("unsupported"))
      });
      mocks.scanFrame.mockReturnValue("valid_payload");

      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
    });

    it("ignores a frame that finishes decoding after the scanner closes", async () => {
      videoHasFrames();
      let finish!: (text: string) => void;
      mocks.createNativePdf417Detector.mockResolvedValue({
        detect: vi.fn(() => new Promise<string>((resolve) => (finish = resolve)))
      });

      let unmount!: () => void;
      await act(async () => {
        ({ unmount } = renderWithToast(<WebcamScanner onClose={mockOnClose} />));
      });
      await waitFor(() => expect(finish).toBeTypeOf("function"));
      act(() => unmount());
      await act(async () => {
        finish("valid_payload");
      });

      expect(mockLoadJson).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("reading an image", () => {
    it("lets a phone offer the photo library, not only the camera", async () => {
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });
      // `capture` makes iOS and Android skip straight to the camera.
      expect(screen.getByLabelText("Select image for barcode scanning")).not.toHaveAttribute(
        "capture"
      );
    });

    it("loads a barcode read from the chosen image", async () => {
      mocks.scanStill.mockResolvedValue("valid_payload");
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await act(async () => chooseImage());

      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mocks.loadImage).toHaveBeenCalledWith("blob:mock-url");
      expect(mockLoadJson).toHaveBeenCalledWith({ state: "CA", version: "10" }, "valid_payload");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("uses the platform reader for images too", async () => {
      mocks.createNativePdf417Detector.mockResolvedValue({
        detect: vi.fn().mockResolvedValue("valid_payload")
      });
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await act(async () => chooseImage());

      await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
      expect(mocks.scanStill).not.toHaveBeenCalled();
    });

    it("refuses a barcode whose AAMVA version this build cannot render", async () => {
      // A payload can name any two-digit version. Loading one with no field table
      // reported success and then left the user staring at a blank form.
      mocks.scanStill.mockResolvedValue("unsupported_version_payload");
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await act(async () => chooseImage());

      await waitFor(() => {
        expect(
          screen.getByText(/AAMVA version 99, which this build does not support/)
        ).toBeInTheDocument();
      });
      expect(mockLoadJson).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("displays an error when no barcode is found", async () => {
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await act(async () => chooseImage());

      await waitFor(() => {
        expect(
          screen.getByText("Could not find a readable PDF417 barcode in the selected image.")
        ).toBeInTheDocument();
      });
    });

    it("displays an error when the image cannot be opened", async () => {
      mocks.loadImage.mockRejectedValue(new Error("corrupt"));
      await act(async () => {
        renderWithToast(<WebcamScanner onClose={mockOnClose} />);
      });

      await act(async () => chooseImage());

      await waitFor(() => {
        expect(screen.getByText(/Could not find a readable PDF417 barcode/)).toBeInTheDocument();
      });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("ignores an image result arriving after the scanner closes", async () => {
      let resolve!: (text: string) => void;
      mocks.scanStill.mockReturnValue(new Promise<string>((done) => (resolve = done)));
      let unmount!: () => void;
      await act(async () => {
        ({ unmount } = renderWithToast(<WebcamScanner onClose={mockOnClose} />));
      });
      await act(async () => chooseImage());
      await waitFor(() => expect(mocks.scanStill).toHaveBeenCalled());
      unmount();
      await act(async () => {
        resolve("valid_payload");
      });
      expect(mockLoadJson).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });
});
