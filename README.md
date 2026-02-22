# AAMVA PDF417 Generator

A browser-first tool for creating **AAMVA-formatted payloads** and rendering them as **PDF417 barcodes**.

This project is designed for **local, offline use** and runs with plain HTML/CSS/JavaScript. It also includes an optional Electron wrapper if you prefer a desktop app window.

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
- [JSON import format](#json-import-format)
- [Troubleshooting](#troubleshooting)
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

- **Runs locally in the browser** (`index.html`) with no backend.
- **Optional desktop app mode** via Electron (`npm start`).
- **Schema-driven field forms** per selected version.
- **State metadata/IIN mapping** for all 50 U.S. states (+ DC).
- **Unsupported territories are explicitly disabled** in the UI.
- **Live barcode rendering** as you type.
- **Payload visibility tools**:
  - Decoded output panel
  - Raw codewords panel
  - Payload inspector panel
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
  - Current keys include legacy and modern entries such as `08`, `09`, `10`, and `2020`.
- **Validation is intentionally lightweight.**
  - It checks required-ness and basic formats (examples: date/ZIP/single-char) but does not enforce every jurisdiction-specific rule.
- **Territories are marked unsupported.**
  - `AS`, `GU`, `VI`, and `PR` are present but disabled.
- **No backend persistence.**
  - Data is not stored on a server. Refreshing/reopening may lose unsaved work.
- **No cryptographic signature/security layer.**
  - This is payload generation and visual barcode encoding, not identity verification.
- **Test coverage is currently partial.**
  - The repository includes a Node test suite for schema/data logic, but does not yet include UI/browser automation or CI wiring.
  - You should add additional QA and validation procedures before depending on it in sensitive workflows.

---

## Tech stack and architecture

- **Frontend:** Vanilla JavaScript + HTML + CSS
- **Barcode encoding:** `bwip-js` (bundled minified build in `lib/bwip-js.min.js`)
- **AAMVA schema + payload creation:** `aamva.js`
- **UI controller and event wiring:** `js/app.js`
- **Optional desktop runtime:** Electron (`main.js`, `preload.js`)
- **PDF export library:** `jspdf` (bundled minified UMD build in `lib/`)

---

## Quick start (no install)

If you only want to try the app:

1. Download the repo.
2. Open `index.html` in Chrome/Firefox/Edge/Safari.
3. Select state + version, fill fields, and export.

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
git clone https://github.com/<your-org-or-user>/aamva-pdf417-generator.git
cd aamva-pdf417-generator
```

#### Option B: ZIP download

1. Download ZIP from your repository page.
2. Extract it.
3. Open terminal in the extracted folder.

---

### Step 2: Open in browser mode

No package install needed for this mode.

- Double-click `index.html`, or right-click → open with your browser.
- If the browser blocks local file behavior, use a tiny local server:

```bash
npx serve .
```

Then open the URL shown in terminal (usually `http://localhost:3000`).

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

## JSON import format

There is no rigid external API contract, but a practical file usually looks like:

```json
{
  "state": "CA",
  "version": "08",
  "DCS": "DOE",
  "DAC": "JANE",
  "DBB": "19940131",
  "DBA": "20300131",
  "DAQ": "D1234567",
  "DAG": "123 MAIN ST",
  "DAI": "LOS ANGELES",
  "DAJ": "CA",
  "DAK": "90001"
}
```

Tips:
- Dates should use `YYYYMMDD` where required.
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

## Developer notes

- Update schema definitions in `aamva.js` to add/edit versions and fields.
- The payload generator and validation helpers are also in `aamva.js`.
- UI flow lives in `js/app.js`.
- PDF417 implementation lives in `lib/pdf417.js`.

---

## Project structure

```text
.
├── index.html
├── main.js
├── preload.js
├── package.json
├── README.md
├── aamva.js
├── decoder.js
├── js/
│   └── app.js
├── lib/
│   ├── pdf417.js
│   └── jspdf.umd.min.js
├── css/
│   ├── style.css
│   └── themes.css
└── assets/
    └── sample.json
```

---

## License

MIT License (see `package.json`).

© 2025 Sean Vera
