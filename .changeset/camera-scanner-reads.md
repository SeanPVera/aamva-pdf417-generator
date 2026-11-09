---
"aamva-pdf417-generator": patch
---

Make the barcode scanner actually scan.

**The camera now opens on a first visit.** The scanner waited for a camera ID before opening a camera, but browsers report every camera with a blank ID until access has been granted, and access is only requested by opening a camera. So the camera never started, never asked for permission, and the dialog showed a black box indefinitely. It now asks for the rear camera by facing mode and fills the camera picker once access is granted. A remembered camera that has gone away falls back to the same request. An insecure (`http://`) page now says the camera needs https instead of showing nothing.

**Tilted cards now read.** ZXing's PDF417 reader only tries a frame upright or turned 180°, and a card held five degrees off level defeated it. Frames now go through `core/scanPipeline.ts`, which measures the tilt, de-rotates, and reads at a noise-averaging width. On 32 simulated 1080p hand-held scenes the old path read 1 and the new one reads 26, most on the first frame. In Chromium with a fake camera, six jittered hand-held clips the old scanner could not read in 12 seconds each now read in 0.2–0.5 s.

**The camera asks for 1920×1080.** Without a size, browsers open at 640×480, too coarse for a licence barcode.

**Photos read too.** "Choose barcode image" runs the same pipeline over the photo, so a tilted or blurry phone photo reads where only a clean screenshot did before. The file picker no longer forces the camera on phones, so it offers the photo library as well.

Where the browser has a native PDF417 `BarcodeDetector` (Chrome on Android and macOS) it runs alongside ZXing; this path is not exercised by any browser in CI. `@zxing/browser` is no longer used and has been removed, which shrinks the scanner chunk from 113 KB to 107 KB gzipped.
