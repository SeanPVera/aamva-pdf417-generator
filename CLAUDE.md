# CLAUDE.md — AI Assistant Guide for aamva-pdf417-generator

This file provides AI assistants (Claude, Copilot, etc.) with the context needed to work effectively in this codebase.

---

## Project Overview

**aamva-pdf417-generator** is a fully client-side AAMVA PDF417 barcode generator for U.S. driver's licenses and ID cards. It implements the AAMVA (American Association of Motor Vehicle Administrators) specification across versions 01–10 for all 50 states, D.C., and U.S. territories.

**Key traits:**
- Zero server-side code — runs entirely in the browser or as an Electron desktop app
- No build/transpilation step — vanilla JavaScript, load directly in browser
- Data never leaves the user's device (localStorage only)

---

## Repository Structure

```
/
├── index.html              # HTML UI — form fields, canvas, debug textareas
├── main.js                 # Electron entry point (BrowserWindow setup, security)
├── preload.js              # Electron contextBridge — exposes safe APIs to renderer
├── aamva.js                # Core AAMVA schema: state IINs, versions 01–10, field metadata
├── decoder.js              # Payload decoder: parses AAMVA format strings back to JSON
├── js/
│   └── app.js              # UI controller: event handlers, rendering, localStorage, export
├── lib/
│   ├── bwip-js.min.js      # bwip-js barcode renderer (PDF417 via bcid="pdf417")
│   └── jspdf.umd.min.js    # jsPDF (minified UMD build) — included verbatim, do not edit
├── css/
│   └── style.css           # Main stylesheet + theme variables (2-space indent, CSS custom properties)
├── test/
│   ├── aamva.test.js       # Schema, payload, decoder, and validation tests (Node.js built-in runner)
│   └── app.test.js         # DOM integration tests using JSDOM
├── assets/
│   └── sample.json         # Example import payload for manual testing
├── LICENSE                  # MIT license
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
└── .github/
    └── workflows/
        └── node.js.yml     # CI: Node 18/20/22 matrix, npm ci → lint → build → test
```

---

## Architecture & Module Roles

### `aamva.js` — Schema (source of truth)
Exports to `window.*` globals:

| Global | Contents |
|---|---|
| `window.AAMVA_STATES` | Object keyed by 2-letter code: `{ CA: { iin, aamvaVersion, name } }` |
| `window.AAMVA_VERSIONS` | Object keyed by `"01"`–`"10"`: `{ name, fields: [...] }` |
| `window.AAMVA_FIELD_OPTIONS` | Enumerated field values (sex, eye color, etc.) |
| `window.AAMVA_FIELD_LIMITS` | Max character lengths per field code |

**Do not** change field codes — they are standardized two-uppercase-letter + alphanumeric AAMVA data element identifiers (regex: `^[A-Z]{2}[A-Z0-9]$`).

### `lib/bwip-js.min.js` — Encoder
Exposes `window.bwipjs`. PDF417 rendering is done with `bcid: "pdf417"` and encoder options (columns, eclevel, compact, scale).

**Encoder behavior is sensitive.** Any change to bwip-js integration options should be validated by running the full test suite and cross-checking with a physical barcode scanner.

### `js/app.js` — UI Controller
- Reads schema from `window.AAMVA_*` globals
- Manages DOM form state and localStorage persistence
- Calls `window.bwipjs` to render barcodes
- Handles JSON import/export and PDF download via jsPDF

### `decoder.js` — Decoder
Exposes `window.AAMVA_DECODER`. Parses raw AAMVA format strings (subfile content) back to structured JSON. Used for verification in the debug panel.

### `main.js` / `preload.js` — Electron Shell
Security settings are intentional and must be preserved:
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`

`preload.js` uses `contextBridge.exposeInMainWorld` to provide any Node.js APIs needed by the renderer. The app works in both browser and Electron contexts — the preload gracefully no-ops when running in a plain browser.

---

## Development Workflows

### Running in the Browser (No install)
```bash
# Open index.html directly — no server or build needed
open index.html        # macOS
xdg-open index.html    # Linux
# Or just drag index.html into a browser tab
```

### Running as Electron Desktop App
```bash
npm install
npm start       # or: npm run dev
```

### Building a Distributable
```bash
npm run build   # Outputs to /dist (AppImage, .exe, .dmg depending on OS)
```

### Running Tests
```bash
npm test
# Internally: node --test test/*.test.js
```
Tests use **Node.js built-in `node:test`** and **`node:assert/strict`** — no external test framework. Node.js 18+ is required.

---

## Testing Conventions

- Test files: `test/aamva.test.js` (schema/payload/decoder) and `test/app.test.js` (DOM integration)
- Import only what is needed via `require('../aamva.js')` style (CommonJS)
- Use `test(description, () => { ... })` blocks from `node:test`
- Use `assert.strictEqual`, `assert.ok`, `assert.deepStrictEqual` from `node:assert/strict`
- Group related cases under `describe()` blocks when logical
- **Do not** add Jest, Mocha, or any external test runner — keep the zero-dependency test setup

**What is tested:**
1. State definitions — all jurisdictions have valid 6-digit IINs, no duplicates
2. Constrained field options — enums for sex, eye color, hair color, etc.
3. Field length limits — max character enforcement
4. AAMVA versions 01–10 — structure and field code format
5. Version-specific fields — e.g., version 01 uses `DAA` (full name), versions 04+ add truncation flags
6. State-to-version mapping — auto-selects correct AAMVA version per state
7. Field validation — date format (`MMDDYYYY` for v02+, `YYYYMMDD` for v01), ZIP `12345` or `12345-6789`
8. Payload generation — golden vectors, header structure, directory length, ZIP padding, uppercase enforcement
9. Decoder round-trip — encode then decode preserves field values
10. DOM integration — state selection, field rendering, JSON import, form clear

---

## Code Style Conventions

- **Indentation:** 2 spaces (no tabs)
- **Variables/functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Module pattern:** IIFE exposing a namespace: `window.NAMESPACE = (() => { ... })()`
- **No ES modules (`import`/`export`)** — all files use script-tag globals and IIFEs for browser compatibility
- **No TypeScript** — plain JavaScript throughout
- **Comments:** File-level JSDoc headers; inline comments for non-obvious logic
- **Linting:** ESLint (`.eslintrc.json`) and Prettier (`.prettierrc`) are configured; run `npm run lint` and `npm run format:check`

---

## Key AAMVA Concepts for Editing

### IIN (Issuer Identification Number)
Each state has a unique 6-digit IIN embedded in the PDF417 header. Defined in `aamva.js`. Required to be accurate per the AAMVA standard.

### Data Elements / Field Codes
Fields are identified by 3-character codes (e.g., `DAA`, `DCS`, `DAB`). These are standardized and must not be invented or altered. Versions differ in which fields are mandatory, optional, or absent.

### AAMVA Versions
- `"01"` — oldest (AAMVA DL/ID-2000); uses `DAA` for full name (not split)
- `"04"`–`"07"` — intermediate; split name fields (`DCS`, `DAC`, `DAD`)
- `"08"` — 2013 standard; adds organ donor/veteran fields (`DDK`, `DDL`)
- `"09"`–`"10"` — most recent; used by newer state implementations

### Auto-version selection
`aamva.js` maps state codes to their currently-used AAMVA version. When a user selects a state, `app.js` calls this mapping and auto-populates the version selector.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/node.js.yml`):
- **Triggers:** Push to `main`, PRs targeting `main`
- **Matrix:** Node.js 18.x, 20.x, 22.x
- **Steps:** `npm ci` → `npm run lint` → `npm run build --if-present` → `npm test`

All tests must pass on all three Node.js versions before merging.

---

## What NOT to Do

- **Do not** add a bundler (webpack, Vite, Rollup) — the browser-direct loading is intentional
- **Do not** introduce `import`/`export` ES module syntax — breaks browser compatibility
- **Do not** edit `lib/jspdf.umd.min.js` — it is a vendored minified library
- **Do not** relax Electron security flags (`nodeIntegration`, `contextIsolation`, `sandbox`)
- **Do not** add network requests — this app must remain 100% offline-capable
- **Do not** store user data outside localStorage (no IndexedDB, no cookies, no remote storage)
- **Do not** add an external test runner — keep `node:test` built-in

---

## Common Tasks

### Add a new AAMVA field
1. Add the field object to the relevant version's `fields` array in `aamva.js`
2. If the field has constrained values, add them to `AAMVA_FIELD_OPTIONS`
3. If the field has a length limit, add it to `AAMVA_FIELD_LIMITS`
4. Add a test in `test/aamva.test.js` verifying the field exists in the expected version(s)

### Add or update a state
1. Edit the state entry in `AAMVA_STATES` in `aamva.js` (IIN must be the correct 6-digit issuer code)
2. Update the state-to-version mapping if the state's AAMVA version differs
3. Run `npm test` to verify no duplicate IINs or structural violations

### Fix a PDF417 encoding bug
1. Review `js/app.js` barcode option mapping and current `bwip-js` usage before making changes
2. Changes to cluster tables, codeword generation, or Reed-Solomon polynomials require careful validation
3. After changes, run `npm test` and also physically scan a generated barcode with a real scanner to confirm

### Update the UI
1. Edit `index.html` for structure, `css/style.css` for styling
2. Edit `js/app.js` for behavior (DOM manipulation, event listeners)
3. Theme variables live in `css/style.css` via `[data-theme]` selectors; add new themes by defining new CSS custom property sets

---

## Dependency Summary

| Package | Type | Purpose |
|---|---|---|
| `electron` | devDependency | Desktop app runtime |
| `electron-builder` | devDependency | Packages app into OS installers |
| `eslint` | devDependency | Code linting |
| `prettier` | devDependency | Code formatting |
| `jsdom` | devDependency | DOM environment for tests |
| `bwip-js` | dependency | PDF417 barcode generation (also vendored in `lib/`) |
| `jspdf` | dependency | PDF generation (also vendored in `lib/`) |

No external test framework dependencies — uses Node.js built-in `node:test`.
