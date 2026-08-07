# aamva-pdf417-generator

## 1.0.0

First stable release.

### Highlights

- **AAMVA payload generation** for versions `01`–`10`, covering all 50 U.S.
  states, the District of Columbia, and U.S. territories, with per-jurisdiction
  IINs, field exclusions, and state-specific DAQ/DCF/DDB generators.
- **PDF417 rendering** on canvas via bwip-js, updating live as fields change.
- **Decoder and structural validator** with a strict mode that promotes
  warnings to blocking errors, plus cross-field checks for date chronology and
  age at issuance.
- **Exports** to PNG, SVG, and PDF, and JSON import/export for form sessions.
- **Webcam scanning** through ZXing for round-tripping an existing barcode back
  into the form.
- **Runs fully offline.** No backend, no analytics, no CDN assets. The
  production build ships a `connect-src 'none'` Content-Security-Policy, and a
  service worker precaches every emitted bundle for cold offline loads.
- **Desktop builds** for Windows (NSIS), macOS (DMG), and Linux
  (AppImage, deb), packaged by electron-builder with `contextIsolation`,
  `sandbox`, and renderer permission denial enabled.
- **Installable as a PWA** on mobile, with a web app manifest and icons.

### Security posture

- No personally identifiable field data is written to disk. Only UI
  preferences — jurisdiction, version, strict mode, theme, and similar — are
  persisted to `localStorage`.
- The Electron shell restricts navigation to the app's own files and, in
  development, the Vite dev server; everything else is handed to the system
  browser. Popups are denied.

### Known limitations

- This is not a government-certified issuer implementation. Jurisdiction rule
  depth varies; see [`docs/AAMVA_COMPLIANCE_MATRIX.md`](docs/AAMVA_COMPLIANCE_MATRIX.md).
- There is no cryptographic signature or verification layer. The tool encodes
  payloads; it does not attest to them.
- Desktop installers are not code-signed. macOS Gatekeeper and Windows
  SmartScreen will warn on first launch.
