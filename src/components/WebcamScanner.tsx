import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserPDF417Reader } from "@zxing/browser";
import { decodeAAMVA } from "../core/decoder";
import { Camera, X, AlertTriangle, ImagePlus, Video } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";

// iOS Safari does not support the getUserMedia-based live scanner reliably.
// Detect it so we can default to the photo-upload path instead.
function detectIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

interface WebcamScannerProps {
  onClose: () => void;
}

export function WebcamScanner({ onClose }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const isIOS = detectIOS();
  const loadJson = useFormStore((s) => s.loadJson);
  const setStateVersion = useFormStore((s) => s.setStateVersion);

  const applyDecodedPayload = useCallback(
    (text: string) => {
      const decoded = decodeAAMVA(text);
      if (decoded.ok && decoded.json) {
        const { state, version } = decoded.json;
        if (state && version) setStateVersion(state, version);
        loadJson(decoded.json);
        onClose();
        return;
      }
      setError("Detected a barcode, but it is not a valid AAMVA DL/ID format.");
    },
    [loadJson, onClose, setStateVersion]
  );

  // Load available cameras once on mount (skip on iOS — prefer photo-upload path)
  useEffect(() => {
    if (isIOS) return;
    BrowserPDF417Reader.listVideoInputDevices()
      .then((devs) => {
        setDevices(devs);
        // Default: prefer rear-facing camera (last device, same heuristic as before)
        if (devs.length > 0) {
          setSelectedDeviceId(devs[devs.length - 1].deviceId);
        }
      })
      .catch(() => {
        // Permission not yet granted — scanner start will surface the real error
      });
  }, [isIOS]);

  // Start/restart scanner whenever selectedDeviceId changes (not used on iOS)
  useEffect(() => {
    if (!selectedDeviceId || isIOS) return;

    let reader: BrowserPDF417Reader | null = null;
    let controls: { stop: () => void } | null = null;
    let cancelled = false;

    const startScanner = async () => {
      try {
        setScanning(true);
        setError(null);
        reader = new BrowserPDF417Reader();

        if (videoRef.current && !cancelled) {
          controls = await reader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result) => {
              if (result) {
                controls?.stop();
                applyDecodedPayload(result.getText());
              }
            }
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setScanning(false);
          const msg = err instanceof Error ? err.message : "Failed to initialize camera.";
          setError(msg);
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [selectedDeviceId, applyDecodedPayload]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan DL/ID Barcode"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-white dark:bg-slate-800 p-6 rounded-t-2xl sm:rounded-xl shadow-2xl max-w-lg w-full relative"
        style={{ paddingBottom: "max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))" }}
      >
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
              className="flex-1 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
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

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelection}
          className="hidden"
          aria-label="Select image for barcode scanning"
        />

        {isIOS ? (
          /* iOS: skip live camera — just show the photo/camera button prominently */
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageScanning}
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-6 py-4 min-h-[56px] text-base font-semibold text-white shadow disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              aria-busy={imageScanning}
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              {imageScanning ? "Scanning image…" : "Open Camera / Choose Photo"}
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Tap above to take a photo of the PDF417 barcode or pick one from your library.
              The form will auto-fill when decoded.
            </p>
          </div>
        ) : (
          <>
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
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageScanning}
                className="inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-600 px-3 py-2 min-h-[44px] text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-busy={imageScanning}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                {imageScanning ? "Scanning image…" : "Use photo instead"}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Pick from Photos or open camera directly on mobile.
              </span>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Hold the PDF417 barcode steadily in front of the camera. The form will auto-fill when
              successfully decoded.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
