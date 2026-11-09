import { rgbaToGray, type GrayFrame } from "../core/scanPipeline";

// `torch` and `focusMode` are non-standard track capabilities missing from the
// DOM typings; narrow them locally so they can be feature-detected without `any`.
export type CameraCapabilities = MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };
export type CameraConstraintSet = MediaTrackConstraintSet & { torch?: boolean; focusMode?: string };

/**
 * Without a size, browsers open the camera at 640×480. A licence barcode then
 * spans a few hundred pixels for its ~250–350 modules, under two pixels per
 * module, which is too few to read.
 */
const CAMERA_RESOLUTION: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 }
};

/** Why the camera cannot be used here at all, or null when it can be tried. */
export function cameraUnavailableReason(): string | null {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return "The camera only works on a secure (https) page. Open the app over https — the installed or GitHub Pages copy — or use “Choose barcode image” below.";
  }
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "This browser does not offer camera access. Use “Choose barcode image” below instead.";
  }
  return null;
}

/**
 * Opens a camera without needing to know its ID first.
 *
 * Until the user grants access, browsers that follow the spec report cameras
 * with a blank deviceId — current Chromium does — so asking for "the rear
 * camera" by facing mode is the only request that can work on a first visit.
 * Gating the start on a non-blank ID meant the camera never opened, and access
 * was never requested, so it never would. A remembered
 * deviceId is tried when there is one; a camera that has since gone away falls
 * back to the facing-mode request.
 */
export async function openCamera(deviceId?: string): Promise<MediaStream> {
  const video: MediaTrackConstraints = deviceId
    ? { ...CAMERA_RESOLUTION, deviceId: { exact: deviceId } }
    : { ...CAMERA_RESOLUTION, facingMode: { ideal: "environment" } };
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: false });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (deviceId && (name === "OverconstrainedError" || name === "NotFoundError")) {
      return openCamera(undefined);
    }
    throw err;
  }
}

/** Cameras that can be chosen by ID. Empty until camera access is granted. */
export async function listCameras(): Promise<MediaDeviceInfo[]> {
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter((device) => device.kind === "videoinput" && device.deviceId !== "");
}

/** Phone cameras focus close-up far more readily in continuous mode. */
export async function enableContinuousFocus(track: MediaStreamTrack | null): Promise<void> {
  if (!track || typeof track.getCapabilities !== "function") return;
  const caps = track.getCapabilities() as CameraCapabilities;
  if (!caps.focusMode?.includes("continuous")) return;
  try {
    await track.applyConstraints({
      advanced: [{ focusMode: "continuous" } as CameraConstraintSet]
    });
  } catch {
    // Focus is an optimisation; the browser's default still scans.
  }
}

/**
 * Draws a video frame or image into `canvas`, at most `maxSide` pixels on its
 * longer side, and returns its luma. Null when the canvas cannot be read.
 */
export function grabGrayFrame(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  maxSide: number
): GrayFrame | null {
  if (sourceWidth <= 0 || sourceHeight <= 0) return null;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  // Resizing a canvas reallocates and clears it; skip that when nothing changed.
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return rgbaToGray(ctx.getImageData(0, 0, width, height).data, width, height);
}

/** Loads an image URL. Modern browsers apply EXIF orientation when it is drawn. */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The image could not be read."));
  });
  image.src = url;
  await loaded;
  return image;
}

export interface NativePdf417Detector {
  detect(source: CanvasImageSource): Promise<string | null>;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
}
interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

/**
 * The platform's own barcode reader (Chrome on Android and macOS), when it
 * reads PDF417. Used alongside ZXing, never instead of it: no browser in this
 * repo's test matrix ships one, so its output is unverified here, and the
 * ZXing path keeps running either way. Null everywhere else, including iOS.
 */
export async function createNativePdf417Detector(): Promise<NativePdf417Detector | null> {
  const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (!Detector) return null;
  try {
    const formats = await Detector.getSupportedFormats();
    if (!formats.includes("pdf417")) return null;
    const detector = new Detector({ formats: ["pdf417"] });
    return {
      async detect(source) {
        const codes = await detector.detect(source);
        return codes.find((code) => code.rawValue)?.rawValue ?? null;
      }
    };
  } catch {
    return null;
  }
}

/**
 * Maps a thrown camera error into a one-line, user-actionable message.
 * Falls back to the original error message when nothing matches.
 */
export function describeCameraError(err: unknown): string {
  const fallback = err instanceof Error ? err.message : "Failed to initialize camera.";
  const name = err instanceof Error ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Click the lock icon in your browser's address bar and allow camera access, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No usable camera was found on this device. Use “Choose barcode image” below to scan from a saved image.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your camera is in use by another app. Close other camera apps (e.g. Zoom, FaceTime) and reopen this scanner.";
    case "AbortError":
      return "Camera startup was interrupted. Try opening the scanner again.";
    default:
      return fallback;
  }
}
