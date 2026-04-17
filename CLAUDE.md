# CLAUDE.md — AI Assistant Guide for aamva-pdf417-generator

This file provides AI assistants (Claude, Copilot, etc.) with the context needed to work effectively in this codebase.

---

## Project Overview

**aamva-pdf417-generator** is a fully client-side AAMVA PDF417 barcode generator for U.S. driver's licenses and ID cards. It implements the AAMVA (American Association of Motor Vehicle Administrators) specification across versions 01–10 for all 50 states, D.C., and U.S. territories.

**Key traits:**
- Zero server-side code — runs entirely in the browser or as an Electron desktop app
- Built with React + TypeScript + Vite; Tailwind CSS for styling
- Data never leaves the user's device (AES-encrypted localStorage only; PII fields are never persisted)

---

## Repository Structure

```
/
├── index.html                    # Vite HTML entry point
├── main.js                       # Electron entry point (BrowserWindow setup, security hardening)
├── preload.js                    # Electron contextBridge — exposes ping/version to renderer
├── vite.config.ts                # Vite + Vitest configuration
├── tsconfig.json                 # TypeScript config (app)
├── tsconfig.node.json            # TypeScript config (Node/build tooling)
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── .eslintrc.cjs                 # ESLint (TypeScript + React aware)
├── .eslintrc.json                # ESLint fallback (browser globals, Electron overrides)
├── .prettierrc                   # Prettier (2-space, no trailing comma, 100-char line)
├── src/
│   ├── main.tsx                  # React root render with ErrorBoundary
│   ├── App.tsx                   # Main app component: layout, keyboard shortcuts, theme
│   ├── setupTests.ts             # Vitest setup (testing-library/jest-dom)
│   ├── core/
│   │   ├── schema.ts             # AAMVA versions 01–10 field definitions, IINs, options
│   │   ├── states.ts             # 54 jurisdictions (50 states + DC + 4 territories)
│   │   ├── generator.ts          # AAMVA payload generator with state-specific rules
│   │   ├── decoder.ts            # Payload decoder and structural validator
│   │   ├── validation.ts         # Field validation, cross-field checks, state-specific rules
│   │   └── stateThemes.ts        # Per-jurisdiction color palettes for UI theming
│   ├── hooks/
│   │   └── useFormStore.ts       # Zustand store: encrypted persistence, undo/redo, all form state
│   ├── components/
│   │   ├── Header.tsx            # Top bar: undo/redo, theme, import/export JSON, clear, scanner
│   │   ├── Sidebar.tsx           # State/version selector, strict mode toggle, subfile type
│   │   ├── BarcodePreview.tsx    # PDF417 canvas via bwip-js, payload display, PDF export
│   │   ├── BatchProcessor.tsx    # Bulk field operations UI
│   │   ├── WebcamScanner.tsx     # ZXing-based barcode scanner modal
│   │   ├── VersionBrowser.tsx    # Modal for exploring AAMVA versions 01–10
│   │   └── ErrorBoundary.tsx     # React error boundary
│   └── tests/
│       ├── aamva.test.ts         # Schema, payload, decoder, and validation tests
│       ├── decoder.test.ts       # Decoder round-trip and edge case tests
│       ├── crossFieldValidation.test.ts  # Date ordering, age-at-issuance checks
│       ├── stateThemes.test.ts   # Color palette completeness and CSS variable tests
│       └── helpers.test.ts       # Utility function tests
├── assets/
│   └── sample.json               # Example import payload for manual testing
├── LICENSE                       # MIT license
└── .github/
    └── workflows/
        └── node.js.yml           # CI: Node 18/20/22 matrix, lint → build → test → audit
```

---

## Architecture & Module Roles

### `src/core/schema.ts` — Schema (source of truth)

Named exports:

| Export | Contents |
|---|---|
| `AAMVA_VERSIONS` | Object keyed by `"01"`–`"10"`: `{ name, fields: AAMVAField[] }` |
| `AAMVA_FIELD_OPTIONS` | Enumerated values for sex, eye color, hair color, race/ethnicity, etc. |
| `AAMVA_FIELD_LIMITS` | Max character lengths per field code |
| `AAMVA_STATE_EXCLUDED_FIELDS` | Fields excluded per jurisdiction (e.g., NY excludes `DAW`, `DAX`, `DAZ`, `DCL`) |
| `getFieldsForVersion(v)` | Returns full field array for a version |
| `getFieldsForStateAndVersion(stateCode, v)` | Filters by state exclusions |
| `getMandatoryFields(stateCode, version)` | Mandatory fields only |
| `describeVersion(v)` | Human-readable version summary |

**Do not** change field codes — they are standardized 3-character AAMVA data element identifiers (`^[A-Z]{2}[A-Z0-9]$`).

### `src/core/states.ts` — Jurisdiction Registry

| Export | Contents |
|---|---|
| `AAMVA_STATES` | Record of 54 jurisdictions: `{ [code]: AAMVAStateDef }` |
| `isJurisdictionSupported(stateCode)` | Boolean check |
| `getVersionForState(stateCode)` | Default AAMVA version per state |

### `src/core/generator.ts` — Payload Generator

| Export | Contents |
|---|---|
| `generateAAMVAPayload(stateCode, version, fields, dataObj, options)` | Main payload builder |
| `generateDocumentDiscriminator(length?)` | Random 12-char alphanumeric DCF |
| `generateStateDiscriminator(stateCode)` | State-specific DCF generator |
| `generateStateLicenseNumber(stateCode)` | State-specific DAQ generator |
| `generateStateCardRevisionDate(stateCode, issueDateStr)` | Auto-generates DDB from era ranges |

### `src/core/decoder.ts` — Decoder / Validator

| Export | Contents |
|---|---|
| `validateAAMVAPayloadStructure(payload, strictMode)` | Validates AAMVA format compliance |
| `decodePayload(text)` | Generic decoder (handles AAMVA format or JSON) |
| `decodeAAMVAFormat(text)` | Parses AAMVA binary format string to JSON |
| `decodeAAMVA(text)` | High-level decoder returning `{ ok, json, mapped }` |
| `describeFields(obj)` | Human-readable field descriptions |

### `src/core/validation.ts` — Validation

| Export | Contents |
|---|---|
| `AAMVA_STATE_RULES` | Per-state regex validators and generators |
| `validateFieldValue(field, value, stateCode, strictMode)` | Single field validation |
| `validateCrossFieldConsistency(dataObj, fields)` | Date ordering, age-at-issuance logic |
| `getValidationIssues(fields, values, stateCode, strictMode)` | Full validation report |
| `sanitizeFieldValue(value)` | Strips control characters |

### `src/core/stateThemes.ts` — Color Palettes

| Export | Contents |
|---|---|
| `STATE_THEMES` | Record of 54 jurisdiction palettes: `{ primary, primaryDark, accent, onPrimary, onAccent, tint }` |
| `DEFAULT_STATE_THEME` | Fallback palette |
| `getStateTheme(code)` | Returns palette with fallback |
| `applyStateThemeToDocument(stateCode)` | Sets CSS custom properties on `<html>` |

### `src/hooks/useFormStore.ts` — Zustand State Store

State shape: `state`, `version`, `strictMode`, `subfileType`, `fields`, `theme`, `_history`, `_future`

Key actions:

| Action | Description |
|---|---|
| `setField(code, value)` | Update a field value and push to undo history |
| `setStateVersion(state, version)` | Switch jurisdiction/version, rebuild field list |
| `setStrictMode(mode)` | Toggle strict validation |
| `setSubfileType(type)` | Toggle DL vs ID subfile type |
| `setTheme(theme)` | Switch UI theme (light / dark / dmv) |
| `clearFields()` | Reset all fields |
| `loadJson(data)` | Import from JSON object |
| `undo()` / `redo()` | Navigate edit history (20-item limit) |
| `canUndo()` / `canRedo()` | Check history availability |

**Persistence:** Zustand + CryptoJS AES encryption for localStorage. PII fields are intentionally excluded from persistence.

### `src/components/` — UI Components

| Component | Purpose |
|---|---|
| `Header.tsx` | Top bar: undo/redo, theme toggle, import/export JSON, clear, scanner launch |
| `Sidebar.tsx` | State/territory selector, version selector, strict mode toggle, subfile type, version browser |
| `BarcodePreview.tsx` | PDF417 canvas (bwip-js), payload display, decoded JSON, validation issues, PDF/PNG export |
| `BatchProcessor.tsx` | Bulk field operations |
| `WebcamScanner.tsx` | ZXing barcode scanner modal |
| `VersionBrowser.tsx` | Explore AAMVA field definitions by version |
| `ErrorBoundary.tsx` | Graceful error fallback |

### `main.js` / `preload.js` — Electron Shell

Security settings are intentional and must be preserved:
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`

`preload.js` exposes `window.api.ping()` and `window.api.version` via `contextBridge.exposeInMainWorld`. The app works in both browser and Electron contexts.

---

## Development Workflows

### Quick Start (Browser Dev Server)
```bash
npm run easy        # npm install && npm run dev
# App runs at http://localhost:5173
```

### Mobile / Network Access
```bash
npm run easy:mobile   # npm install && npm run dev:mobile
# Binds to 0.0.0.0:3000 for LAN access
```

### Electron Desktop App
```bash
npm install
npm run electron:dev   # Runs Vite dev server + Electron concurrently
npm start              # Electron only (requires prior build or running dev server)
```

### Building a Distributable
```bash
npm run build   # Vite build → dist/; electron-builder packages OS installers
```

### Running Tests
```bash
npm test
# Internally: vitest (Vitest with jsdom environment)
```

### Linting & Formatting
```bash
npm run lint            # ESLint (max-warnings 0)
npm run format          # Prettier write
npm run format:check    # Prettier check (used in CI)
```

**Pre-commit hook** (Husky + lint-staged) runs ESLint and Prettier automatically on staged files.

---

## Testing Conventions

- **Framework:** Vitest with jsdom environment (configured in `vite.config.ts`)
- **Test files:** `src/tests/*.test.ts`
- **Setup:** `src/setupTests.ts` imports `@testing-library/jest-dom`
- Use `describe()`, `it()` / `test()`, `expect()` — Vitest API
- Use `@testing-library/react` for component tests
- **Do not** add Jest, Mocha, or any alternative test runner

**Test coverage areas:**

1. **Schema** — all 54 jurisdictions have valid 6-digit IINs with no duplicates; field code format
2. **Field options** — enums for sex, eye color, hair color, race/ethnicity
3. **Field limits** — max character enforcement per field code
4. **AAMVA versions 01–10** — structure and required fields
5. **State exclusions** — `AAMVA_STATE_EXCLUDED_FIELDS` per jurisdiction
6. **State-specific generators** — DAQ, DCF, DDB patterns per state
7. **Payload generation** — golden vectors, header structure, directory length, uppercase enforcement
8. **Decoder round-trip** — encode then decode preserves field values
9. **Cross-field validation** — date ordering (expiry > issue > birth), age at issuance (14+)
10. **State themes** — palette completeness, hex color format, CSS custom property application

---

## Code Style Conventions

- **Language:** TypeScript throughout (`src/`); plain JS only for `main.js` and `preload.js`
- **Framework:** React 19 with functional components and hooks
- **Indentation:** 2 spaces (no tabs)
- **Variables/functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Modules:** ES module `import`/`export` inside `src/`; CommonJS only in Electron files
- **Styling:** Tailwind CSS utility classes; CSS custom properties for theme variables
- **Formatting:** Prettier — no trailing commas, double quotes, 100-char line width, semicolons on
- **Linting:** ESLint with `@typescript-eslint` and `react-hooks` plugins; `no-explicit-any` warns
- **Comments:** Only for non-obvious logic; no multi-paragraph docstrings

---

## Key AAMVA Concepts for Editing

### IIN (Issuer Identification Number)
Each jurisdiction has a unique 6-digit IIN embedded in the PDF417 header. Defined in `src/core/states.ts`. Must match the official AAMVA issuer codes exactly.

### Data Elements / Field Codes
Fields use 3-character codes (e.g., `DAA`, `DCS`, `DAB`). These are standardized — do not invent or alter them. Versions differ in which fields are mandatory, optional, or absent.

### AAMVA Versions
- `"01"` — oldest (AAMVA DL/ID-2000); uses `DAA` for full name (not split)
- `"04"`–`"07"` — intermediate; split name fields (`DCS`, `DAC`, `DAD`)
- `"08"` — 2013 standard; adds organ donor/veteran fields (`DDK`, `DDL`)
- `"09"`–`"10"` — most recent; used by newer state implementations

### Auto-version Selection
`getVersionForState(stateCode)` in `src/core/states.ts` maps each jurisdiction to its default AAMVA version. When a user selects a state, `useFormStore.setStateVersion()` rebuilds the field list accordingly.

### State Themes
`applyStateThemeToDocument(stateCode)` sets CSS custom properties (`--color-primary`, `--color-accent`, etc.) on `<html>` derived from `STATE_THEMES` in `src/core/stateThemes.ts`. All 54 jurisdictions have curated palettes.

### Strict Mode
When enabled, validation warnings are treated as errors and block payload generation. Controlled by `setStrictMode()` in the Zustand store.

### Undo/Redo
`setField()` pushes state to `_history` (20-item cap). `undo()`/`redo()` navigate the stack. History is not persisted across sessions.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/node.js.yml`):
- **Triggers:** Push to `main`, PRs targeting `main`
- **Matrix:** Node.js 18.x, 20.x, 22.x
- **Steps:** `npm ci` → `npm run lint` → `npm run format:check` → `npm run build` → `npm test` → `npm audit --audit-level=high`

All steps must pass on all three Node versions before merging.

---

## What NOT to Do

- **Do not** revert to vanilla JS or remove TypeScript — the codebase is fully typed
- **Do not** remove Vite or replace the bundler — it is required for the React/TS build
- **Do not** use CommonJS `require()` inside `src/` — use ES module imports
- **Do not** relax Electron security flags (`nodeIntegration`, `contextIsolation`, `sandbox`)
- **Do not** add network requests — this app must remain 100% offline-capable
- **Do not** store PII outside encrypted localStorage (no IndexedDB, no cookies, no remote storage)
- **Do not** add an external test runner — use Vitest only
- **Do not** bypass the Husky pre-commit hook (`--no-verify`) without fixing the underlying lint/format issue

---

## Common Tasks

### Add a new AAMVA field
1. Add the field object to the relevant version's `fields` array in `src/core/schema.ts`
2. If the field has constrained values, add them to `AAMVA_FIELD_OPTIONS`
3. If the field has a length limit, add it to `AAMVA_FIELD_LIMITS`
4. Add a test in `src/tests/aamva.test.ts` verifying the field exists in the expected version(s)

### Add or update a jurisdiction
1. Edit `AAMVA_STATES` in `src/core/states.ts` (IIN must be the correct 6-digit issuer code)
2. Update `getVersionForState()` if the jurisdiction's AAMVA version differs
3. Add a color palette entry in `src/core/stateThemes.ts`
4. Run `npm test` to verify no duplicate IINs or structural violations

### Add a state-specific validation rule
1. Add a rule entry in `AAMVA_STATE_RULES` in `src/core/validation.ts`
2. Include a regex pattern for the relevant field code (e.g., DAQ for license number)
3. Add a test in `src/tests/aamva.test.ts` for the new rule

### Fix a PDF417 encoding bug
1. Review `BarcodePreview.tsx` for bwip-js option mapping
2. Changes to encoder options (columns, eclevel, compact, scale) require validation with a physical scanner
3. After changes, run `npm test` and physically scan a generated barcode to confirm

### Update the UI
1. Edit component files in `src/components/` for behavior
2. Use Tailwind utility classes for styling; avoid inline styles
3. Theme colors come from CSS custom properties set by `applyStateThemeToDocument()` — add new theme variables there

---

## Dependency Summary

| Package | Type | Purpose |
|---|---|---|
| `react` / `react-dom` | dependency | UI framework (v19) |
| `zustand` | dependency | Lightweight state management with persistence |
| `crypto-js` | dependency | AES encryption for localStorage |
| `bwip-js` | dependency | PDF417 barcode encoding and canvas rendering |
| `jspdf` | dependency | PDF generation for barcode export |
| `lucide-react` | dependency | Icon library |
| `@zxing/browser` / `@zxing/library` | dependency | Webcam barcode scanning |
| `electron` | devDependency | Desktop app runtime |
| `electron-builder` | devDependency | Packages app into OS installers |
| `vite` / `@vitejs/plugin-react` | devDependency | Build tool and React plugin |
| `vitest` | devDependency | Test runner (replaces Node built-in test) |
| `@testing-library/react` | devDependency | React component testing utilities |
| `jsdom` | devDependency | DOM environment for Vitest |
| `typescript` | devDependency | Type checking |
| `tailwindcss` | devDependency | Utility-first CSS framework |
| `eslint` + `@typescript-eslint/*` | devDependency | Code linting |
| `prettier` | devDependency | Code formatting |
| `husky` / `lint-staged` | devDependency | Pre-commit lint/format hooks |
| `concurrently` / `cross-env` / `wait-on` | devDependency | Electron dev workflow utilities |
