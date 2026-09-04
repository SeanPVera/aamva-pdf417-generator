import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserPDF417Reader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { decodeAAMVA } from "../core/decoder";
import { AAMVA_VERSION_KEYS, isSupportedVersion } from "../core/schema";
import {
  Camera,
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
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const loadJson = useFormStore((s) => s.loadJson);
  const setStateVersion = useFormStore((s) => s.setStateVersion);
  const storedCameraId = useFormStore((s) => s.cameraDeviceId);
  const setCameraDeviceId = useFormStore((s) => s.setCameraDeviceId);
  const toast = useToast();
  const dialogRef = useModalShell<HTMLDivElement>({ open: true, onClose });

  const applyDecodedPayload = useCallback(
    (text: string) => {
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
          return;
        }
        if (state && version) setStateVersion(state, version);
        // The raw bytes ride along so the byte ledger can inspect the card
        // itself. Re-encoding from the form discards the padding and the
        // unrecognised elements that are the whole reason to look.
        loadJson(decoded.json, text);
        toast.success(`Scanned ${state || "ID"}${version ? ` v${version}` : ""}`);
        onClose();
        return;
      }
      setError("Detected a barcode, but it is not a valid AAMVA DL/ID format.");
    },
    [loadJson, onClose, setStateVersion, toast]
  );

  // Load available cameras once on mount. Prefer the camera the user scanned
  // with last time; otherwise default to the last device (usually the rear
  // camera on phones).
  useEffect(() => {
    BrowserPDF417Reader.listVideoInputDevices()
      .then((devs) => {
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
      if (result) {
        scannerControls.stop();
        applyDecodedPayload(result.getText());
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
  }, [selectedDeviceId, applyDecodedPayload, setCameraDeviceId]);

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

    setError(null);
    setImageScanning(true);

    const imageReader = new BrowserPDF417Reader();
    const imageUrl = URL.createObjectURL(file);

    try {
      const result = await imageReader.decodeFromImageUrl(imageUrl);
      applyDecodedPayload(result.getText());
    } catch {
      setError("Could not find a readable PDF417 barcode in the selected image.");
    } finally {
      URL.revokeObjectURL(imageUrl);
      setImageScanning(false);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Scan DL/ID Barcode"
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-lg w-full relative"
      >
        <button
          data-autofocus
          onClick={onClose}
          aria-label="Close scanner"
          className="absolute top-4 right-4 inline-flex h-k-touch w-k-touch items-center justify-center rounded-k text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <Camera className="w-6 h-6 text-blue-500" />
          Scan DL/ID Barcode
        </h2>

        {/* Camera selector — only shown when multiple cameras available */}
        {devices.length > 1 && (
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
            <label
              htmlFor="camera-select"
              className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap"
            >
              Camera:
            </label>
            <select
              id="camera-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="h-k-control min-h-k-touch flex-1 rounded-k border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-k-value text-slate-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            aria-label="Camera feed for barcode scanning"
          />
          {scanning && !error && (
            <div className="absolute inset-0 border-2 border-blue-500/50 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border border-red-500/80 rounded relative" aria-hidden>
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
              </div>
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
            className="inline-flex h-k-touch min-h-k-touch items-center gap-2 rounded-k border border-slate-300 dark:border-slate-600 px-3 text-k-help font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-busy={imageScanning}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {imageScanning ? "Scanning image…" : "Use photo (iPhone-friendly)"}
          </button>
          {devices.length > 1 && (
            <button
              type="button"
              onClick={handleFlipCamera}
              className="inline-flex h-k-touch min-h-k-touch items-center gap-2 rounded-k border border-slate-300 dark:border-slate-600 px-3 text-k-help font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
              className="inline-flex h-k-touch min-h-k-touch items-center gap-2 rounded-k border border-slate-300 dark:border-slate-600 px-3 text-k-help font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Pick from Photos or open camera directly on mobile.
          </span>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Hold the PDF417 barcode steadily in front of the camera. The form will auto-fill when
          successfully decoded.
        </p>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          The camera feed stays on this device — nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
