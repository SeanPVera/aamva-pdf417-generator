# CLAUDE.md — AI Assistant Guide for aamva-pdf417-generator

This file provides AI assistants (Claude, Copilot, etc.) with the context needed to work effectively in this codebase.

---

## Project Overview

**aamva-pdf417-generator** is a fully client-side AAMVA PDF417 barcode generator for U.S. driver's licenses and ID cards. It implements the AAMVA (American Association of Motor Vehicle Administrators) specification across versions 01–10 for all 50 states, D.C., and U.S. territories. Versions 05, 06, and 07 share the 2009 (v04) data-element set — those revisions changed card design and security requirements rather than the DL subfile.

**Key traits:**
- Zero server-side code — runs entirely in the browser or as an Electron desktop app
- Built with React + TypeScript + Vite; Tailwind CSS for styling
- Data never leaves the user's device (UI preferences in localStorage only; PII fields are never persisted)

---

## Repository Structure

```
/
├── index.html                    # Vite HTML entry point
├── main.js                       # Electron entry point (BrowserWindow setup, security hardening)
├── preload.js                    # Electron contextBridge — exposes ping/version to renderer
├── vite.config.mts               # Vite + Vitest configuration
├── tsconfig.json                 # TypeScript config (app)
├── tsconfig.node.json            # TypeScript config (Node/build tooling)
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── eslint.config.mjs             # ESLint flat config (TS/React, Electron, SW, tooling blocks)
├── .prettierrc                   # Prettier (2-space, no trailing comma, 100-char line)
├── .size-limit.json              # Per-chunk bundle-size budgets enforced in CI
├── playwright.config.ts          # Playwright config (browser matrix via PW_BROWSERS)
├── CHANGELOG.md                  # Release notes; changesets prepends new versions
├── electron/
│   └── urlPolicy.js              # Navigation allow-list for the Electron shell (unit tested)
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   ├── sw.js                     # Service worker; precache manifest injected at build
│   └── icons/                    # PWA icons (PNG for iOS/Android, SVG for scalable use)
├── scripts/
│   ├── gen-vectors.mjs           # Regenerates golden conformance vectors
│   ├── gen-icons.mjs             # Rasterizes the app icon to PNG (zlib only, no image deps)
│   └── release-notes.mjs         # Extracts a CHANGELOG section for a GitHub Release
├── e2e/                          # Playwright specs (a11y, export, form fill, round-trip, themes)
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
│   │   ├── dateHelpers.ts        # Flexible date parsing/formatting + relative date chips
│   │   ├── quickFix.ts           # Deterministic repairs for values the validator rejects
│   │   ├── pasteImport.ts        # Classifies clipboard text into a loadable field map
│   │   ├── roadTest.ts           # Parallel-parking physics and examiner scoring (decorative)
│   │   ├── jurisdictionRules.ts  # Per-jurisdiction rule packs
│   │   ├── barcodeDimensions.ts  # PDF417 row/column sizing for the encoder
│   │   ├── exportNaming.ts       # Filename construction for PNG/SVG/PDF/JSON exports
│   │   ├── presets.ts            # Jurisdiction/sample presets
│   │   ├── sampleFiller.ts       # Fills the form with plausible sample data
│   │   ├── crypto.ts             # secureGetRandomInt (rejection sampling, no modulo bias)
│   │   ├── stateThemes.ts        # Per-jurisdiction color palettes for UI theming
│   │   └── conformance/vectors/  # Golden payload vectors per jurisdiction/version
│   ├── hooks/
│   │   └── useFormStore.ts       # Zustand store: UI-pref persistence, undo/redo, form state
│   ├── components/
│   │   ├── Header.tsx            # Top bar: undo/redo, theme, import/export JSON, clear, scanner
│   │   ├── Sidebar.tsx           # State/version selector, strict mode toggle, subfile type
│   │   ├── BarcodePreview.tsx    # PDF417 canvas via bwip-js, payload display, PNG/SVG/PDF export
│   │   ├── BatchProcessor.tsx    # Bulk field operations UI
│   │   ├── WebcamScanner.tsx     # ZXing-based barcode scanner modal
│   │   ├── VersionBrowser.tsx    # Modal for exploring AAMVA versions 01–10
│   │   ├── GroupNav.tsx          # Per-group error/empty counts with jump-to-group
│   │   ├── MobileActionBar.tsx   # Sticky mobile status + export strip
│   │   ├── RoadTest.tsx          # The parallel-parking exam (lazy, decorative)
│   │   └── ErrorBoundary.tsx     # React error boundary
│   ├── stubs/
│   │   └── jspdfOptionalRenderer.ts  # Stubs jsPDF's unused html2canvas/dompurify/canvg
│   └── tests/                    # Vitest suites (see Testing Conventions below)
│       ├── aamva.test.ts         # Schema, payload, decoder, and validation tests
│       ├── decoder.test.ts       # Decoder round-trip and edge case tests
│       ├── crossFieldValidation.test.ts  # Date ordering, age-at-issuance checks
│       ├── property.test.ts      # fast-check property-based invariants
│       ├── electronUrlPolicy.test.ts     # Electron navigation allow-list
│       ├── pwaInstall.test.ts    # iOS Home Screen requirements (PNG icons, safe areas, manifest)
│       ├── serviceWorker.test.ts # sw.js routing, loaded into a fake worker scope
│       ├── stateThemes.test.ts   # Color palette completeness and CSS variable tests
│       └── helpers.test.ts       # Utility function tests
├── docs/
│   ├── AAMVA_COMPLIANCE_MATRIX.md    # Per-jurisdiction implementation coverage
│   └── IPHONE.md                     # Running on iPhone with no Mac/computer (hosted PWA)
├── assets/
│   └── sample.json               # Example import payload for manual testing
├── LICENSE                       # MIT license
└── .github/
    └── workflows/
        ├── node.js.yml           # CI: Node 20/22, lint/format/typecheck/build/test/coverage/size/audit
        ├── e2e.yml               # Playwright across chromium/firefox/webkit + mobile emulations
        ├── pages.yml             # Builds dist/ and publishes the PWA to GitHub Pages
        └── release.yml           # Changesets version PR, then installers + GitHub Release
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
| `getMandatoryFields(stateCode, version)` | Mandatory fields only, derived from `getFieldsForStateAndVersion` so it can never drift from the rendered form |
| `AAMVA_VERSION_KEYS` | Version tokens in ascending order — use this for pickers, never `Object.keys(AAMVA_VERSIONS)` (see note below) |
| `isSupportedVersion(v)` | Whether this build has a field table for `v` |
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

### `src/core/dateHelpers.ts` — Date entry

| Export | Contents |
|---|---|
| `normalizeDateInput(raw, format, now?)` | `8/11/2026`, `2026-08-11`, `08112026` → the wire form; `null` when it cannot resolve without guessing |
| `parseAamvaDateParts(value, format)` | Canonical string → `{ year, month, day }`, calendar-checked |
| `describeAamvaDate(value, format)` | `"Aug 11, 2026"` |
| `yearsBetween(from, to, format)` | Whole years, used for age-at-issue |
| `todayAamva(format, now?)` / `shiftYears(value, years, format)` | Chip values (Feb 29 clamps rather than rolling) |
| `getDateChips(code, fields, format, now?)` | One-click offers per date field, anchored to sibling values |

Two-digit years are only accepted from *separated* input and resolve against a
pivot of `current year + 10`. A bare digit run is never padded — that would
invent digits the user did not type.

### `src/core/quickFix.ts` — Deterministic repairs

| Export | Contents |
|---|---|
| `getQuickFix(field, value, state, strict)` | Best repair for a value that **fails** validation |
| `getCanonicalRewrite(field, value, state, strict)` | For a value that passes but is not what the encoder writes (casing, ZIP dash, height notation) |
| `getQuickFixes(fields, values, state, strict)` | Both kinds across a schema — what "Fix all" applies |

**Invariant:** a fix is only returned once `evaluateFieldValue` accepts the
rewritten value, and never for an empty field. A quick fix rewrites what the
user typed; it must never invent data.

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
| `setDerivedField(code, value)` | Update an app-owned value (today only `DAJ`) **without** touching undo history — a derived value is not an edit |
| `setStateVersion(state, version)` | Switch jurisdiction/version, rebuild field list |
| `setStrictMode(mode)` | Toggle strict validation |
| `setSubfileType(type)` | Toggle DL vs ID subfile type |
| `setTheme(theme)` | Switch UI theme (light / dark / dmv) |
| `clearFields()` | Reset all fields |
| `mergeFields(patch)` | Apply many field values as ONE undo step — use for any bulk action |
| `loadJson(data)` | Import from JSON object |
| `undo()` / `redo()` | Navigate edit history (20-item limit) |
| `canUndo()` / `canRedo()` | Check history availability |

**Persistence:** Zustand `persist` middleware over plain `localStorage`. `partialize` restricts what is written to UI preferences only — the AAMVA `fields` payload is never persisted, so no PII reaches disk. An earlier version wrapped storage in CryptoJS AES, but the key sat in plaintext localStorage beside the ciphertext and provided no real protection against same-origin access; it was removed rather than left as security theater. Do not reintroduce client-side encryption here without a key that lives outside the origin.

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
# App runs at http://localhost:3000 (vite.config.mts pins server.port)
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

- **Framework:** Vitest with jsdom environment (configured in `vite.config.mts`)
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
11. **Scan oracle** (`src/tests/scanOracle.test.ts`) — renders each jurisdiction's payload with bwip-js, rasterises it, and decodes it back with ZXing. This is the only check that does not grade our encoder with our own decoder, so it catches assumptions the two share. Helpers live in `src/tests/support/scanOracle.ts`.
12. **Conformance provenance** (`src/tests/conformanceProvenance.test.ts`) — every vector must declare a `tier` (`synthetic` / `published` / `issued`) and its source. `MIN_REAL_WORLD_JURISDICTIONS` is a ratchet: raise it when a real-world vector is added so coverage cannot silently regress.
13. **Date entry** (`src/tests/dateHelpers.test.ts`) — flexible parsing, the two-digit-year pivot, refusal to pad short digit runs, and the relative chips. Uses a fixed `now` so the pivot is a property of the code, not of the run date.
14. **Quick fixes** (`src/tests/quickFix.test.ts`) — every returned fix is re-checked against `evaluateFieldValue`; empty fields never get one.
15. **Paste import** (`src/tests/pasteImport.test.ts`) — round-trips a generated payload, and asserts that non-AAMVA keys are dropped rather than loaded.
16. **Road test** (`src/tests/roadTest.test.ts`) — vehicle physics, SAT collision, park inspection, and the examiner's score sheet. Pure functions only; the canvas is not involved.

**Important:** a passing `conformance.test.ts` against a `synthetic` vector proves only that the encoder has not changed — those bytes came from the encoder. Do not treat it as evidence of AAMVA correctness, and do not regenerate vectors to make a failing test pass without reviewing the diff against the spec.

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

Two warning channels feed that promise and both are enforced at generation time:

- **Cross-field** warnings from `validateCrossFieldConsistency` (date ordering, validity span, age at issue).
- **Per-field** advisories from the jurisdiction rule packs in `jurisdictionRules.ts`. `evaluateFieldValue` promotes these from `warning` to `error` when `strictMode` is set, and `generateAAMVAPayload` refuses to build.

`validateFieldValue` deliberately takes no strict-mode parameter — its checks (enumerations, length limits, jurisdiction validators, type formats) are never advisory. Severity lives in `evaluateFieldValue`.

### Auto-Generated Fields
`generateAAMVAPayload`'s `autoGenerateDiscriminator` option may only invent `DCF` (document discriminator) and `DDB` (card revision date) — see `AUTO_GENERATED_CODES` in `generator.ts`. **`DAQ` is never auto-generated**: it is the cardholder's real customer/licence number, it is mandatory in every version, and filling it in silently both put a fictional identifier into the barcode and defeated the missing-mandatory-field check.

`generateAAMVAPayload` does not mutate the object it is given. Auto-filled values are visible in the returned payload (decode it), not in the caller's map.

`usePayload` caches the values it auto-fills — keyed on jurisdiction for `DCF`, on jurisdiction + issue date for `DDB` — so the payload stays stable across keystrokes instead of re-rolling on every debounce.

### Undo/Redo
`setField()` pushes state to `_history` (20-item cap). `undo()`/`redo()` navigate the stack. History is not persisted across sessions.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/node.js.yml`):
- **Triggers:** Push to `main`, PRs targeting `main`
- **Matrix:** Node.js 20.x, 22.x
- **Steps (in order):** `npm ci` → `npm run lint` → `npm run format:check` → `npm run typecheck` → `npm run build` → `npm run test:run` → (Node 22 only) `npm run test:coverage` with thresholds → (Node 22 only) `npm run size` (size-limit budget) → upload coverage artifact → `npm audit --audit-level=high`

All steps must pass on both Node versions before merging. Coverage thresholds (lines 85, branches 80, functions 85, statements 85) are configured in `vite.config.mts`. Bundle-size budgets per chunk are defined in `.size-limit.json`.

A separate workflow (`.github/workflows/e2e.yml`) runs Playwright end-to-end tests (`e2e/*.spec.ts`) across chromium, firefox, webkit, and emulated mobile Chrome/Safari.

### Deploying the PWA (`.github/workflows/pages.yml`)

Every push to `main` builds `dist/` on `ubuntu-latest` and publishes it to GitHub Pages, giving the app a permanent HTTPS URL that an iPhone can install to the Home Screen. This is the supported way to run the app on a phone without a Mac or any local machine — see `docs/IPHONE.md`.

Constraints worth preserving:

- `vite.config.mts` sets `base: './'`, and the manifest uses `start_url`/`scope` of `"./"`. Relative paths are what let the same bundle work at a project-page subpath (`/aamva-pdf417-generator/`), from a domain root, and from Electron's `file://`. Do not switch any of them to an absolute `/`.
- iOS ignores an SVG `apple-touch-icon` and substitutes a screenshot of the page, so the PNG icons in `public/icons/` are load-bearing. Regenerate them with `npm run icons:gen` (`scripts/gen-icons.mjs`, dependency-free) rather than adding an image toolchain.
- `index.html` needs `viewport-fit=cover` for `env(safe-area-inset-*)` to report real values on notched iPhones; without it every inset silently resolves to 0 and the translucent status bar overlaps the header.
- `public/sw.js` serves navigations network-first and hashed assets cache-first. An installed iOS web app has no reload button, so a cache-first shell would pin it to a stale build. `src/tests/serviceWorker.test.ts` locks this in.

### Releasing

`.github/workflows/release.yml` runs on every push to `main` and has two modes:

1. **Changesets pending** → `changesets/action` opens or updates a `chore: release` PR that bumps `package.json` and prepends a `CHANGELOG.md` section. Nothing is published.
2. **No changesets pending, and `package.json`'s version has no matching `v<version>` git tag** → the workflow builds desktop installers on `ubuntu-latest`, `macos-latest`, and `windows-latest` (electron-builder, targets/arches taken from the `build` block in `package.json`), then publishes a GitHub Release at that tag with every installer attached.

Notes for anyone touching this:

- The release decision reads the version from the **pushed commit** (`git show "$GITHUB_SHA:package.json"`), not the working tree — `changeset version` can leave a bumped `package.json` behind in the runner.
- Release notes come from `scripts/release-notes.mjs`, which extracts the `## <version>` section of `CHANGELOG.md`. If that section is missing the workflow falls back to GitHub's generated notes rather than shipping an empty body.
- Installer uploads use `if-no-files-found: error`, and the publish job aborts on an empty artifact directory, so a packaging failure can't produce a release with no downloads.
- Builds are unsigned (`CSC_IDENTITY_AUTO_DISCOVERY: false`). Adding signing means adding secrets and removing that env var.
- To ship a change, add a changeset (`npm run changeset`). Version bumps are never hand-edited in `package.json`.

Local hooks (Husky):
- `pre-commit` — `npx lint-staged` (lint + Prettier on staged files)
- `pre-push` — `npm run typecheck` (catch type errors before they reach CI)

---

## What NOT to Do

- **Do not** revert to vanilla JS or remove TypeScript — the codebase is fully typed
- **Do not** remove Vite or replace the bundler — it is required for the React/TS build
- **Do not** use CommonJS `require()` inside `src/` — use ES module imports
- **Do not** relax Electron security flags (`nodeIntegration`, `contextIsolation`, `sandbox`)
- **Do not** add network requests — this app must remain 100% offline-capable
- **Do not** persist PII at all — field values live in memory only (see `partialize` in `useFormStore`); no IndexedDB, no cookies, no remote storage
- **Do not** build a version picker from `Object.keys(AAMVA_VERSIONS)` — `"10"` is an integer-like key and sorts ahead of `"01"`; use `AAMVA_VERSION_KEYS`
- **Do not** call `setField` in a loop for a bulk action — use `mergeFields` so it stays one undo step
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
