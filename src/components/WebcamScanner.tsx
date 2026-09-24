import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserPDF417Reader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { decodeAAMVA } from "../core/decoder";
import { AAMVA_VERSION_KEYS, isSupportedVersion } from "../core/schema";
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

// `torch` is a non-standard MediaTrack constraint/capability not yet in the DOM
// typings; narrow it locally so we can feature-detect without `any`.
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraintSet = MediaTrackConstraintSet & { torch?: boolean };

interface WebcamScannerProps {
  onClose: () => void;
}

/**
 * Maps a thrown camera/scanner error into a one-line, user-actionable message.
 * Falls back to the original error message when nothing matches.
 */
function describeCameraError(err: unknown): string {
  const fallback = err instanceof Error ? err.message : "Failed to initialize camera.";
  const name = err instanceof Error ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Click the lock icon in your browser's address bar and allow camera access, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No usable camera was found on this device. Try the “Use photo” option below to scan from a saved image.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your camera is in use by another app. Close other camera apps (e.g. Zoom, FaceTime) and reopen this scanner.";
    case "AbortError":
      return "Camera startup was interrupted. Try opening the scanner again.";
    default:
      return fallback;
  }
}

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
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const loadJson = useFormStore((s) => s.loadJson);
  const storedCameraId = useFormStore((s) => s.cameraDeviceId);
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

  // Load available cameras once on mount. Prefer the camera the user scanned
  // with last time; otherwise default to the last device (usually the rear
  // camera on phones).
  useEffect(() => {
    BrowserPDF417Reader.listVideoInputDevices()
      .then((devs) => {
        if (!activeRef.current) return;
        setDevices(devs);
        const remembered = devs.find((d) => d.deviceId === storedCameraId);
        const fallback = devs[devs.length - 1];
        const chosen = remembered ?? fallback;
        if (chosen) setSelectedDeviceId(chosen.deviceId);
      })
      .catch(() => {
        // Permission not yet granted — scanner start will surface the real error
      });
  }, [storedCameraId]);

  // `applyDecodedPayload` closes over `onClose` and `toast`, both of which are
  // re-created on every render of a parent that re-renders for any reason —
  // `App` subscribes to the whole form store, so a keystroke or badge update
  // anywhere in the app produced a new reference. Depending on it directly
  // from the scanner-start effect below tore down and restarted the live
  // camera stream on every such render, which starved ZXing of the run of
  // stable frames a PDF417 symbol needs to decode. Route through a ref
  // instead, the same fix `pasteStateRef` applies to the clipboard listener.
  const applyDecodedPayloadRef = useRef(applyDecodedPayload);
  useEffect(() => {
    applyDecodedPayloadRef.current = applyDecodedPayload;
  }, [applyDecodedPayload]);

  // Start/restart scanner whenever selectedDeviceId changes
  useEffect(() => {
    if (!selectedDeviceId) return;

    let reader: BrowserPDF417Reader | null = null;
    let controls: { stop: () => void } | null = null;
    let cancelled = false;

    const handleDecode = (
      result: Result | undefined,
      _error: unknown,
      scannerControls: IScannerControls
    ) => {
      if (result && !cancelled && activeRef.current) {
        if (applyDecodedPayloadRef.current(result.getText())) scannerControls.stop();
      }
    };

    const startScanner = async () => {
      try {
        setScanning(true);
        setError(null);
        setTorchOn(false);
        setTorchSupported(false);
        reader = new BrowserPDF417Reader();

        if (videoRef.current && !cancelled) {
          const started = await reader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            handleDecode
          );

          // The camera can finish starting *after* the modal was closed. The
          // cleanup below already ran by then and saw `controls` still null, so
          // without this the track — and the OS camera indicator — stayed live
          // for the rest of the session.
          if (cancelled) {
            started?.stop();
            return;
          }
          controls = started;

          // Remember the working camera and detect torch support.
          if (selectedDeviceId) setCameraDeviceId(selectedDeviceId);
          const stream = videoRef.current.srcObject as MediaStream | null;
          const track = stream?.getVideoTracks()[0] ?? null;
          trackRef.current = track;
          if (track && typeof track.getCapabilities === "function") {
            const caps = track.getCapabilities() as TorchCapabilities;
            setTorchSupported(!!caps.torch);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setScanning(false);
          setError(describeCameraError(err));
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      controls?.stop();
      trackRef.current = null;
    };
  }, [selectedDeviceId, setCameraDeviceId]);

  const handleFlipCamera = () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const next = devices[(idx + 1) % devices.length];
    if (next) setSelectedDeviceId(next.deviceId);
  };

  const handleToggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraintSet] });
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
    const before = useFormStore.getState();

    setError(null);
    setImageScanning(true);

    const imageReader = new BrowserPDF417Reader();
    const imageUrl = URL.createObjectURL(file);

    try {
      const result = await imageReader.decodeFromImageUrl(imageUrl);
      if (!activeRef.current || request !== imageRequest.current) return;
      if (useFormStore.getState().fields !== before.fields) {
        setError(
          "The record changed while reading the image. Select it again to replace the current record."
        );
        return;
      }
      applyDecodedPayload(result.getText());
    } catch {
      if (activeRef.current && request === imageRequest.current)
        setError("Could not find a readable PDF417 barcode in the selected image.");
    } finally {
      URL.revokeObjectURL(imageUrl);
      if (activeRef.current && request === imageRequest.current) setImageScanning(false);
    }
  };

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
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
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
            className="w-full h-full object-cover"
            aria-label="Camera feed for barcode scanning"
          />
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border-2 border-white" aria-hidden />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
          <span className="proof-note">Pick from Photos or open camera directly on mobile.</span>
        </div>

        <p className="proof-note mt-4">
          Hold the PDF417 barcode steadily in front of the camera. The form will auto-fill when
          successfully decoded.
        </p>
        <p className="proof-note mt-1">
          The camera feed stays on this device — nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
