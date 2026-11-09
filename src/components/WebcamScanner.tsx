import React, { useCallback, useEffect, useRef, useState } from "react";
import { decodeAAMVA } from "../core/decoder";
import { AAMVA_VERSION_KEYS, isSupportedVersion } from "../core/schema";
import { createFrameScanner, scanStill } from "../core/scanPipeline";
import {
  X,
  AlertTriangle,
  ImagePlus,
  Video,
  FlipHorizontal2,
  Flashlight,
  FlashlightOff
} from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { useToast } from "./Toast";
import { useModalShell } from "../hooks/useModalShell";
import {
  cameraUnavailableReason,
  createNativePdf417Detector,
  describeCameraError,
  enableContinuousFocus,
  grabGrayFrame,
  listCameras,
  loadImage,
  openCamera,
  type CameraCapabilities,
  type CameraConstraintSet,
  type NativePdf417Detector
} from "./scannerMedia";

interface WebcamScannerProps {
  onClose: () => void;
}

/** Longest side a camera frame is read at; a 4K camera is downscaled to this. */
const LIVE_MAX_SIDE = 1920;
/** Longest side a photo is read at. A 12 MP photo is ~4000px; this keeps a far card legible. */
const STILL_MAX_SIDE = 3072;
/** Pause between live attempts. An attempt itself takes ~50 ms on a laptop. */
const SCAN_INTERVAL_MS = 60;

const NO_BARCODE_IN_IMAGE = "Could not find a readable PDF417 barcode in the selected image.";

type CameraState = "starting" | "live" | "failed";

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function WebcamScanner({ onClose }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const activeRef = useRef(true);
  const imageRequest = useRef(0);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  // Insecure pages and browsers without getUserMedia cannot open a camera at
  // all; say so up front instead of showing a black box.
  const [unavailableReason] = useState(cameraUnavailableReason);
  const [error, setError] = useState<string | null>(unavailableReason);
  const [cameraState, setCameraState] = useState<CameraState>(
    unavailableReason ? "failed" : "starting"
  );
  const [imageScanning, setImageScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  // The camera to ask for; empty means "a rear-facing one". Read once: the
  // store is written below whenever a camera starts, and reacting to that
  // write would restart the stream.
  const [requestedDeviceId, setRequestedDeviceId] = useState(
    () => useFormStore.getState().cameraDeviceId
  );
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const loadJson = useFormStore((s) => s.loadJson);
  const setCameraDeviceId = useFormStore((s) => s.setCameraDeviceId);
  const toast = useToast();
  const dialogRef = useModalShell<HTMLDivElement>({ open: true, onClose });

  const applyDecodedPayload = useCallback(
    (text: string) => {
      if (!activeRef.current) return false;
      const decoded = decodeAAMVA(text);
      if (decoded.ok && decoded.json) {
        const { state, version } = decoded.json;
        // A payload can name any two-digit version. Loading one this build has
        // no field table for reported success and then left the form completely
        // empty, with the failure only visible as a generator error.
        if (version && !isSupportedVersion(version)) {
          setError(
            `This barcode is AAMVA version ${version}, which this build does not support. ` +
              `Supported versions: ${AAMVA_VERSION_KEYS.join(", ")}.`
          );
          return false;
        }
        if (!state || !version) {
          setError("The barcode's issuer or version is not supported. No record was replaced.");
          return false;
        }
        // The raw bytes ride along so the byte ledger can inspect the card
        // itself. Re-encoding from the form discards the padding and the
        // unrecognised elements that are the whole reason to look.
        loadJson(decoded.json, text);
        toast.success(`Scanned ${state || "ID"}${version ? ` v${version}` : ""}`);
        onClose();
        return true;
      }
      setError(decoded.error ?? "Detected a barcode, but it is not a valid AAMVA DL/ID format.");
      return false;
    },
    [loadJson, onClose, toast]
  );

  // `applyDecodedPayload` closes over `onClose` and `toast`, both of which are
  // re-created on every render of a parent that re-renders for any reason —
  // `App` subscribes to the whole form store, so a keystroke or badge update
  // anywhere in the app produced a new reference. Depending on it directly
  // from the camera effect below would tear down and restart the stream on
  // every such render. Route through a ref instead, the same fix
  // `pasteStateRef` applies to the clipboard listener.
  const applyDecodedPayloadRef = useRef(applyDecodedPayload);
  useEffect(() => {
    applyDecodedPayloadRef.current = applyDecodedPayload;
  }, [applyDecodedPayload]);

  // Open the camera, then read frames until one decodes.
  useEffect(() => {
    const video = videoRef.current;
    if (unavailableReason || !video) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let native: NativePdf417Detector | null = null;
    const canvas = document.createElement("canvas");
    const scanFrame = createFrameScanner();

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const tick = async () => {
      timer = undefined;
      if (cancelled) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        let text: string | null = null;
        if (native) {
          try {
            text = await native.detect(video);
          } catch {
            native = null;
          }
          if (cancelled) return;
        }
        if (text === null) {
          const frame = grabGrayFrame(
            video,
            video.videoWidth,
            video.videoHeight,
            canvas,
            LIVE_MAX_SIDE
          );
          if (frame) text = scanFrame(frame);
        }
        if (text !== null && !cancelled && activeRef.current) {
          if (applyDecodedPayloadRef.current(text)) {
            stopStream();
            return;
          }
        }
      }
      if (!cancelled) timer = setTimeout(tick, SCAN_INTERVAL_MS);
    };

    const start = async () => {
      try {
        const opened = await openCamera(requestedDeviceId || undefined);
        // The camera can finish starting *after* the modal was closed. The
        // cleanup has already run by then, so stop the tracks here or the OS
        // camera indicator stays on for the rest of the session.
        if (cancelled) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        video.srcObject = opened;
        try {
          void Promise.resolve(video.play()).catch(() => {});
        } catch {
          // `autoplay` starts it anyway; the scan loop waits for frames.
        }

        const track = opened.getVideoTracks()[0] ?? null;
        trackRef.current = track;
        const deviceId = track?.getSettings?.().deviceId ?? "";
        if (deviceId) {
          setActiveDeviceId(deviceId);
          setCameraDeviceId(deviceId);
        }
        if (track && typeof track.getCapabilities === "function") {
          setTorchSupported(!!(track.getCapabilities() as CameraCapabilities).torch);
        }
        void enableContinuousFocus(track);
        setCameraState("live");

        // IDs and labels only become visible once access has been granted,
        // so the camera picker is filled after the first stream, not before.
        listCameras()
          .then((list) => {
            if (!cancelled) setDevices(list);
          })
          .catch(() => {});

        native = await createNativePdf417Detector();
        if (!cancelled) void tick();
      } catch (err: unknown) {
        if (!cancelled) {
          setCameraState("failed");
          setError(describeCameraError(err));
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      stopStream();
      video.srcObject = null;
      trackRef.current = null;
    };
  }, [requestedDeviceId, setCameraDeviceId, unavailableReason]);

  const switchCamera = (deviceId: string) => {
    if (!deviceId || deviceId === requestedDeviceId) return;
    setCameraState("starting");
    setError(null);
    setTorchOn(false);
    setTorchSupported(false);
    setRequestedDeviceId(deviceId);
  };

  const handleFlipCamera = () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const next = devices[(idx + 1) % devices.length];
    if (next) switchCamera(next.deviceId);
  };

  const handleToggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as CameraConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.target;
    input.value = "";
    if (file.size > 20_000_000) {
      setError("Choose an image smaller than 20 MB.");
      return;
    }
    const request = ++imageRequest.current;
    const isStale = () => !activeRef.current || request !== imageRequest.current;
    const before = useFormStore.getState();

    setError(null);
    setImageScanning(true);

    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await loadImage(imageUrl);
      if (isStale()) return;
      let text: string | null = null;
      const native = await createNativePdf417Detector();
      if (native) {
        try {
          text = await native.detect(image);
        } catch {
          text = null;
        }
      }
      if (text === null) {
        const frame = grabGrayFrame(
          image,
          image.naturalWidth,
          image.naturalHeight,
          document.createElement("canvas"),
          STILL_MAX_SIDE
        );
        if (frame) text = await scanStill(frame, { isCancelled: isStale, pause: yieldToBrowser });
      }
      if (isStale()) return;
      if (text === null) {
        setError(NO_BARCODE_IN_IMAGE);
        return;
      }
      if (useFormStore.getState().fields !== before.fields) {
        setError(
          "The record changed while reading the image. Select it again to replace the current record."
        );
        return;
      }
      applyDecodedPayload(text);
    } catch {
      if (!isStale()) setError(NO_BARCODE_IN_IMAGE);
    } finally {
      URL.revokeObjectURL(imageUrl);
      if (!isStale()) setImageScanning(false);
    }
  };

  const status =
    cameraState === "starting"
      ? "Starting camera… allow access if your browser asks."
      : cameraState === "live"
        ? "Looking for a PDF417 barcode."
        : "Camera unavailable.";

  return (
    <div className="modal-backdrop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Scan DL/ID Barcode"
        className="wb-dialog scanner-dialog relative"
      >
        <button
          data-autofocus
          onClick={onClose}
          aria-label="Close scanner"
          title="Close scanner"
          className="wb-button icon-button absolute top-4 right-4"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="mb-4 pr-12">Scan DL/ID Barcode</h2>

        {/* Camera selector — only shown when multiple cameras available */}
        {devices.length > 1 && (
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
            <label htmlFor="camera-select" className="wb-label whitespace-nowrap">
              Camera:
            </label>
            <select
              id="camera-select"
              value={activeDeviceId}
              onChange={(e) => switchCamera(e.target.value)}
              className="wb-select flex-1"
            >
              {devices.map((dev, idx) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div role="alert" className="field-error mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            aria-label="Camera feed for barcode scanning"
          />
          {cameraState === "live" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border-2 border-white" aria-hidden />
            </div>
          )}
        </div>
        <p className="proof-note mt-2" role="status" aria-live="polite">
          {status}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelection}
            className="hidden"
            aria-label="Select image for barcode scanning"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={imageScanning}
            className="wb-button"
            aria-busy={imageScanning}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {imageScanning ? "Scanning image…" : "Choose barcode image"}
          </button>
          {devices.length > 1 && (
            <button
              type="button"
              onClick={handleFlipCamera}
              className="wb-button"
              title="Switch to the next camera"
              aria-label="Flip camera"
            >
              <FlipHorizontal2 className="h-4 w-4" aria-hidden />
              Flip
            </button>
          )}
          {torchSupported && (
            <button
              type="button"
              onClick={handleToggleTorch}
              aria-pressed={torchOn}
              className="wb-button"
              title="Toggle the camera flashlight"
              aria-label="Toggle flashlight"
            >
              {torchOn ? (
                <FlashlightOff className="h-4 w-4" aria-hidden />
              ) : (
                <Flashlight className="h-4 w-4" aria-hidden />
              )}
              {torchOn ? "Light off" : "Light on"}
            </button>
          )}
          <span className="proof-note">
            On a phone this offers your photo library or the camera.
          </span>
        </div>

        <p className="proof-note mt-4">
          Fill the box with the barcode on the back of the card and hold it steady; a slight tilt is
          fine. The form fills in as soon as it reads.
        </p>
        <p className="proof-note mt-1">
          The camera feed stays on this device — nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
