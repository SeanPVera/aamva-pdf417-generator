# AAMVA PDF417 Generator

A browser-first tool for creating **AAMVA-formatted payloads** and rendering them as **PDF417 barcodes**.

This project is designed for **local, offline-oriented use** and runs as a React + TypeScript app via Vite. It also includes an optional Electron wrapper if you prefer a desktop app window.

> [!WARNING]
> This project is for educational, testing, and research use. Do not use it to create fraudulent IDs or documents. You are responsible for complying with all laws and policies in your jurisdiction.

---

## Table of Contents

- [What this project does](#what-this-project-does)
- [Capabilities](#capabilities)
- [Known limitations](#known-limitations)
- [Tech stack and architecture](#tech-stack-and-architecture)
- [Quick start (no install)](#quick-start-no-install)
- [Full install guide (college-student friendly)](#full-install-guide-college-student-friendly)
  - [Prerequisites](#prerequisites)
  - [Step 1: Download the project](#step-1-download-the-project)
  - [Step 2: Open in browser mode](#step-2-open-in-browser-mode)
  - [Step 3: Run desktop mode with Electron](#step-3-run-desktop-mode-with-electron)
  - [Step 4: Build distributables (optional)](#step-4-build-distributables-optional)
- [How to use the app](#how-to-use-the-app)
- [iPhone-friendly setup (recommended)](#iphone-friendly-setup-recommended)
- [JSON import format](#json-import-format)
- [Troubleshooting](#troubleshooting)
- [Production readiness checklist](#production-readiness-checklist)
- [Developer notes](#developer-notes)
- [Project structure](#project-structure)
- [License](#license)

---

## What this project does

At a high level, the app:

1. Lets you choose a jurisdiction (state) and AAMVA schema/version.
2. Builds a data payload using selected field values.
3. Converts that payload to a PDF417 barcode matrix.
4. Draws the barcode on a canvas in real time.
5. Exports the result as PNG, SVG, or PDF.

---

## Capabilities

- **Runs locally in the browser** with no backend (`npm run dev` / `npm run build`).
- **Optional desktop app mode** via Electron (`npm start`).
- **Schema-driven field forms** per selected version.
- **State metadata/IIN mapping** for all 50 U.S. states (+ DC).
- **Unsupported territories are explicitly disabled** in the UI.
- **Live barcode rendering** as you type.
- **Payload visibility tools**:
  - Decoded output panel
  - Raw codewords panel
  - Payload inspector panel
  - Validation report panel (pass/fail + issue count)
  - Version browser panel
- **Import JSON** to prefill field data.
- **Export** barcode output as:
  - PNG
  - SVG
  - PDF
- **Theming** options in UI (Light / Dark / DMV Blue).
- **Undo/redo controls** for form state changes.

---

## Known limitations

Please read this section carefully if you need strict production-grade compliance.

- **Not a government-certified implementation.**
  - The project is practical and useful for testing workflows, but it is not presented as a certified issuer system.
- **Schema coverage is limited to versions defined in code.**
  - Current keys include versions `01` through `10`, covering legacy (DL/ID-2000) through modern (DL/ID-2020) entries.
- **Validation is intentionally lightweight.**
  - It checks required-ness and basic formats (examples: date/ZIP/single-char), and now surfaces a structured pass/fail issue report in the UI, but does not enforce every jurisdiction-specific rule.
- **Territories are marked unsupported.**
  - `AS`, `GU`, `VI`, and `PR` are present but disabled.
- **No backend persistence.**
  - Data is not stored on a server. Refreshing/reopening may lose unsaved work.
- **No cryptographic signature/security layer.**
  - This is payload generation and visual barcode encoding, not identity verification.
- **Automated unit tests are included and should be run before release.**
  - Run `npm test` to validate schema, payload, decoder, and barcode rendering behavior.

---

## Tech stack and architecture

- **Frontend:** React 19 + TypeScript + Vite
- **State management:** Zustand (persisted storage with encryption layer)
- **Barcode encoding:** `bwip-js`
- **Barcode decode/scanning:** `@zxing/browser` + `@zxing/library`
- **Optional desktop runtime:** Electron (`main.js`, `preload.js`)
- **PDF export library:** `jspdf`

---

## Quick start (no install)

If you only want to try the app:

1. Download the repo.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Open the local URL shown in terminal (usually `http://localhost:5173`).

That is enough for most users.

---

## Full install guide (college-student friendly)

This section assumes zero setup experience.

### Prerequisites

Install these first:

1. **Git** (optional but recommended)
   - Download: <https://git-scm.com/downloads>
2. **Node.js LTS** (required for Electron mode)
   - Download: <https://nodejs.org/>
   - Verify install in terminal:
     ```bash
     node -v
     npm -v
     ```

If those commands print versions, you are ready.

---

### Step 1: Download the project

#### Option A (recommended): Clone with Git

```bash
git clone https://github.com/SeanPVera/aamva-pdf417-generator.git
cd aamva-pdf417-generator
```

#### Option B: ZIP download

1. Download ZIP from your repository page.
2. Extract it.
3. Open terminal in the extracted folder.

---

### Step 2: Open in browser mode

From the project folder:

```bash
npm install
npm run dev
```

Then open the URL shown in terminal (usually `http://localhost:5173`).

---

### Step 3: Run desktop mode with Electron

From the project folder:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch app:
   ```bash
   npm start
   ```

You should see a desktop window titled **AAMVA PDF417 Generator**.

---

### Step 4: Build distributables (optional)

If you want packaged app artifacts:

```bash
npm run build
```

Build output is written to the `dist/` directory (as configured in `package.json`).

---

## How to use the app

1. **Choose State** from the dropdown.
2. **Choose AAMVA Version**.
3. Fill required fields (for example name, DOB, expiration date, ID number, address fields).
4. Watch the **PDF417 Preview** update.
5. Use side panels for diagnostics:
   - **Decoded Output**: object-like representation
   - **Raw Codewords**: encoded symbol codewords
   - **Payload Inspector**: payload text sent to encoder
   - **Version Browser**: schema visibility for a selected version
6. Export from buttons under the canvas:
   - **Export PNG**
   - **Export PDF**
   - **Export SVG**

### Importing JSON

- Click **Import JSON** and select a `.json` file.
- The UI attempts to map keys to known AAMVA field codes.
- Unknown fields can be rejected depending on policy.

---

## iPhone-friendly setup (recommended)

If you want to use this on your iPhone with minimal friction:

1. On your computer (same Wi-Fi network as iPhone), run:
   ```bash
   npm install
   npm run dev:mobile
   ```
2. In terminal, copy the **Network** URL (example: `http://192.168.1.25:3000`).
3. Open that URL in Safari on iPhone.
4. Tap **Share → Add to Home Screen** for a one-tap launcher.
5. In the app, use **Scan DL/ID Barcode → Use photo (iPhone-friendly)** to scan from camera or Photos if live camera scanning is blocked.

Tips:
- Keep both devices on the same Wi-Fi network.
- If the page does not open, allow local network access/firewall for Node/Vite.
- For a production deployment, host the built `dist/` folder over HTTPS so camera permissions are more reliable.

## JSON import format

There is no rigid external API contract, but a practical file usually looks like:

```json
{
  "state": "CA",
  "version": "10",
  "DCS": "DOE",
  "DAC": "JANE",
  "DBB": "01311994",
  "DBA": "01312030",
  "DAQ": "D1234567",
  "DAG": "123 MAIN ST",
  "DAI": "LOS ANGELES",
  "DAJ": "CA",
  "DAK": "90001"
}
```

Tips:
- Date format depends on the selected AAMVA version: version 01 uses `YYYYMMDD`, versions 02+ use `MMDDYYYY`.
- ZIP supports `12345` or `12345-6789`.
- Field requirements vary by selected version.

---

## Troubleshooting

### App opens but no barcode appears

- Ensure both **State** and **Version** are selected.
- Check required fields are filled.
- Open browser DevTools console for error messages.

### Export buttons do nothing

- Make sure a barcode is currently rendered.
- Try a different browser (latest Chrome/Firefox).

### Electron app does not start

- Re-run:
  ```bash
  npm install
  npm start
  ```
- Confirm Node and npm versions are installed correctly.

### “Unsupported territory” is disabled

- This is expected. Territories listed as `null` are intentionally not enabled.

---

## Production readiness checklist

Before shipping this app in an internal or external environment, run through:

- **Dependency hygiene**
  - Run `npm audit` and address vulnerabilities before release.
  - Keep Node/Electron versions aligned with CI and lockfile updates.
- **Quality gates**
  - Run `npm test`, `npm run lint`, and `npm run format:check` in CI.
  - Treat failing checks as release blockers.
- **Electron hardening**
  - `contextIsolation` is enabled, `nodeIntegration` is disabled, and renderer sandboxing is enabled by default.
  - Outbound navigation and popups are blocked in `main.js`.
- **Operational guardrails**
  - Keep this tool restricted to legal and authorized use cases only.
  - Avoid processing real production PII unless your environment has approved controls (device security, encryption, access controls, retention policy).

Suggested release command sequence:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm audit
```

---

## Developer notes

- Core AAMVA schema/version definitions live under `src/core/schema.ts`.
- Payload generation and decode logic live in `src/core/generator.ts` and `src/core/decoder.ts`.
- UI components are in `src/components/`, app composition in `src/App.tsx`.
- State management and persistence are in `src/hooks/useFormStore.ts`.
- Tests are in `src/tests/` and run with Vitest.

---

## Project structure

```text
.
├── src/
│   ├── core/
│   ├── components/
│   ├── hooks/
│   ├── tests/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── main.js
├── preload.js
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

© 2025 Sean Vera
