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
│   ├── ui-audit.mjs              # Measures contrast, touch targets, mobile chrome, red-on-empty
│   └── release-notes.mjs         # Extracts a CHANGELOG section for a GitHub Release
├── e2e/                          # Playwright specs (a11y, contrast, export, form fill, header popovers, round-trip, themes)
├── src/
│   ├── main.tsx                  # React root render with ErrorBoundary
│   ├── App.tsx                   # Main app component: layout, keyboard shortcuts, theme
│   ├── setupTests.ts             # Vitest setup (testing-library/jest-dom)
│   ├── core/
│   │   ├── schema.ts             # AAMVA versions 01–10 field definitions, IINs, options
│   │   ├── states.ts             # 54 jurisdictions (50 states + DC + 4 territories)
│   │   ├── generator.ts          # AAMVA payload generator with state-specific rules
│   │   ├── decoder.ts            # Payload decoder and structural validator
│   │   ├── inspect.ts            # Byte ledger: where every byte of a payload went
│   │   ├── validation.ts         # Field validation, cross-field checks, state-specific rules
│   │   ├── dateHelpers.ts        # Flexible date parsing/formatting + relative date chips
│   │   ├── quickFix.ts           # Deterministic repairs for values the validator rejects
│   │   ├── pasteImport.ts        # Classifies clipboard text into a loadable field map
│   │   ├── derivedFields.ts      # App-owned field codes (DAJ) and user-dirty-state checks
│   │   ├── roadTest.ts           # Parallel-parking physics and examiner scoring (decorative)
│   │   ├── jurisdictionRules.ts  # Per-jurisdiction rule packs + observed encoding profiles
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
│   │   ├── StepRail.tsx          # Section navigator: one rung per field group, with its state
│   │   ├── MobileActionBar.tsx   # Sticky mobile status + export strip
│   │   ├── RoadTest.tsx          # The parallel-parking exam (lazy, decorative)
│   │   └── ErrorBoundary.tsx     # React error boundary
│   ├── assets/
│   │   └── fonts/                # Self-hosted variable faces + their OFL licences
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
| `generateStateDiscriminator(stateCode, issueDateStr?)` | State-specific DCF generator; the issue date is threaded through for issuers that embed it (CT) |
| `generateStateLicenseNumber(stateCode)` | State-specific DAQ generator |
| `generateStateCardRevisionDate(stateCode, issueDateStr)` | Auto-generates DDB from era ranges |

### `src/core/decoder.ts` — Decoder / Validator

| Export | Contents |
|---|---|
| `validateAAMVAPayloadStructure(payload, strictMode)` | Validates AAMVA format compliance |
| `decodePayload(text)` | Generic decoder (handles AAMVA format or JSON) |
| `decodeAAMVAFormat(text)` | Parses AAMVA binary format string to JSON |
| `decodeAAMVA(text)` | High-level decoder returning `{ ok, json, mapped, subfiles }` |
| `describeFields(obj)` | Human-readable field descriptions |

### `src/core/inspect.ts` — Byte ledger

| Export | Contents |
|---|---|
| `inspectPayload(text)` | Per-subfile accounting: declared vs. accounted vs. unaccounted bytes, padding, unknown codes |
| `formatInspection(inspection)` | The ledger as plain text |
| `summarizeAnomalies(inspection)` | One-line verdict, or `null` when the payload balances |

Decoding answers *what does this card say*; inspection answers *where did every
byte go*. Keep them separate — the second is diagnostic detail that has no
business in the path every scan takes.

This exists because a decoded New York credential declared a 323-byte `DL`
subfile whose visible elements accounted for 224, and a list of name/value pairs
cannot distinguish the two explanations: fixed-width padding the reader stripped,
or elements its table had no name for. The ledger shows both — `padding` per
element and `unknownCodes` for the rest.

`inspectPayload` reads the directory with the length-overrun cap lifted
(`readDirectory(text, false, Number.MAX_SAFE_INTEGER)`). A subfile declaring far
more than it holds is the anomaly it measures, so refusing to read one would
defeat the purpose. Do not make the decoder that permissive.

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

### `src/core/derivedFields.ts` — App-owned values

`DAJ` is filled from the jurisdiction picker (`setDerivedField`), so it holds a
value on a form nobody has touched. Every "has the user entered anything" check
— the unsaved-work prompt, the mobile bar's empty state, whether an import needs
an Undo, how many fields `Clear PII` reports — must go through `hasUserData` /
`userEnteredCodes` rather than reading `fields` directly, or a blank form reads
as populated.

### `src/core/validation.ts` — Validation

| Export | Contents |
|---|---|
| `AAMVA_STATE_RULES` | Per-state regex validators and generators |
| `validateFieldValue(field, value, stateCode, strictMode)` | Single field validation |
| `validateCrossFieldConsistency(dataObj, fields)` | Date ordering, age-at-issuance logic |
| `getValidationIssues(fields, values, stateCode, strictMode)` | Full validation report |
| `ValidationIssue.kind` | `"empty"` (blank) vs `"invalid"` (a value the validator rejects) |
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
| `setWhimsy(value)` / `setSoundOn(value)` | Gate the playful flourishes and the clerk-stamp clicks |
| `setMascots(value)` | Gate the two screen-corner residents (Gus, the queue ticket). **Off by default** — they are the only decorations that stay on screen for a whole session rather than firing and leaving, so they are opt-in on top of `whimsy` |
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
| `Sidebar.tsx` | Holds the step rail, then the jurisdiction/version/subfile/strict settings |
| `StepRail.tsx` | One rung per field group; vertical on desktop, a scrollable strip on a phone |
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

### Auditing the UI

```bash
npm run build && npm run serve -- --port 4173 &
node scripts/ui-audit.mjs --url http://localhost:4173
```

Prints pass/fail for the contrast floors and the 44px touch floor, and measures
the two things that have no single right answer: how much of a phone screen is
chrome before the first field, and how many elements paint red on a form nobody
has touched. `--baseline <url>` audits a second build alongside it (run another
revision from a `git worktree` on its own port) so a change can be compared
rather than asserted. `PW_CHROMIUM_PATH` points it at a browser if Playwright
cannot find its own.

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

**End-to-end tests and the section form.** Only the open section's fields are
in the DOM. A spec that reaches for `#DAY` while Identity is showing finds
nothing, because Physical Description has not been rendered — this is the single
most likely reason a previously-green e2e spec fails after a form change. Go
through `revealField` in `e2e/helpers.ts`, which opens the field's rung the way
`handleScrollToField` does in `App.tsx`; `fillField` already does. The other
route is the search box, which shows every match across every section. If
Playwright cannot find a browser locally, point it at one rather than
downloading: the sandbox image may ship a different build than
`@playwright/test` pins.

`e2e/helpers.ts` carries the three moves a spec cannot make on its own, and each
exists because a rename silently broke a suite:

| Helper | What it hides |
|---|---|
| `revealField(page, code)` | Opens the rung holding `code`. No-ops when the field is already on the page, which covers both the right rung and the filtered whole-form view |
| `ensurePanel(page, panel)` | The phone's panel switcher — nav `Mobile panels`, tabs **Setup / Form / Barcode**, active one marked `aria-current="page"`. It moved to the bottom bar and was renamed with it |
| `clickHeaderAction(page, barName, menuName)` | The action bar is `hidden lg:flex`; below that the same actions are **More actions** menu items under shorter names |

A short enumeration renders as a chip group, not a `<select>`: a
`role="radiogroup"` div carrying the field's id, one `role="radio"` button per
value. The button's accessible name is the human description ("Female"), so the
wire value it writes ("2") is exposed as `data-value` — the same contract as
`data-severity` on the validation rows. `fillField` branches on the role.

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

`DCK` (inventory control number) is optional from `"03"` onward and absent from `"01"`/`"02"`.
`DDD` (limited duration document indicator) is optional from `"08"` onward. Both were added
after decoded cards were found carrying them.

### Subfiles and the header directory

A payload is a header, then a directory of N 10-byte entries, then N subfiles.
The first entry is always `DL` or `ID`; AAMVA reserves subfile types beginning
with `Z` for the issuing jurisdiction and says nothing about their contents.

The directory is what makes the layout self-describing, and it is easy to get
subtly wrong:

- The first subfile's offset is **not** a constant. It is `21 + entries × 10` —
  31 with one entry, 41 with two. Code that hardcodes `0031` breaks the moment a
  jurisdiction subfile appears.
- `generateAAMVAPayload` partitions the field list on `field.subfile`. Elements
  tagged `"jurisdiction"` go to the `Z*` subfile and must never be written into
  the `DL`/`ID` subfile, where a reader expects standard codes only.
- The jurisdiction subfile is emitted only when at least one of its elements
  holds a value, so the common single-subfile output is byte-identical to what
  this app produced before multi-subfile support existed.

Two jurisdictions have profiles, both read off decoded cards: Connecticut
(`ZC`) and New York (`ZN`). Their elements are surfaced in the form through
`getFieldsForStateAndVersion`, which appends them per jurisdiction, and they are
tagged `subfile: "jurisdiction"` so nothing else has to special-case them.

Jurisdiction subfile values are **opaque**. They are exempt from the upper-casing
the AAMVA text rule applies to standard string fields, because a real NY card
carries a mixed-case blob in `ZNB` and upper-casing it would rewrite data whose
meaning is not published anywhere.

### Jurisdiction encoding profiles

`jurisdictionRules.ts` carries an optional `encoding` block per jurisdiction
recording where an issuer's *wire format* departs from the spec default: the
two-digit **jurisdiction version** in the header (NY emits `04`, not the `00`
this app assumed for everyone), element order within the subfile, whether `DAK`
is space-filled to its fixed 11-character width, and any jurisdiction subfile.
Defaults in `schema.ts` and `generator.ts` are the spec reading; this block is
where a deviation observed on a real card is written down.

Not everything a card shows belongs in a profile. New York's element order turned
out to match the schema default exactly — so nothing is recorded for it, and the
default is now confirmed rather than assumed.

Only add an entry you can trace to a decoded credential, and cite it in
`source`. Absence of a profile means nobody has checked that jurisdiction — not
that the spec reading has been confirmed for it.

**A profile's evidence is narrower than its reach.** New York's plastic DL card
and New York's DMV interim photo document are both IIN 636001 and both AAMVA
v10, and their wire formats disagree on nearly everything a profile records:
jurisdiction version (`04` vs `00`), space fill (100 bytes of it vs none),
element order (schema default vs `DAQ` first), and whether empty elements are
emitted at all (the interim document writes `DCA`, `DCF`, `DCG`, `DCU` and `ZNA`
as bare codes with no value). Neither reading is wrong — each is right about the
document it came from.

But `getJurisdictionEncoding` keys on the jurisdiction alone, and nothing
selects on document type: one profile per jurisdiction is what the generator
applies, for `DL` and `ID` output alike. So `source` must name the document the
bytes came from — that is the claim the entry can actually support — and a
decoded credential that contradicts a profile shows how far that claim
generalises before it shows a bug. Recording a second variant would mean adding
the selection mechanism first.

### Height notation

`DAU` has two live formats in the wild. Connecticut writes total inches with a
unit (`069 IN`); New York writes feet and inches as three digits (`603` for
6'3"). Both are 6 characters or fewer and both validate.

`normalizeHeight` in `quickFix.ts` must not "correct" the second into the first:
`603` read as inches is fifty feet. `isFeetInchesNotation` guards this — a
three-digit value whose leading digit is 4–7 and whose trailing pair is ≤ 11 is
left alone. Keep that guard ahead of the inches branch if you touch the function.

### Reading directories that do not add up

Real encoders miscount. The Connecticut card this profile came from declares its
`DL` subfile one byte longer than the bytes it contains, which puts the declared
offset of the following `ZC` subfile one past where `ZC` actually begins.

`readDirectory` in `decoder.ts` therefore verifies each entry against the type
bytes at its declared offset and nudges onto the marker when it just misses,
within `SUBFILE_OFFSET_TOLERANCE` (4) bytes. Strict mode disables the nudge and
additionally requires subfiles to be exactly contiguous — the generator
self-checks with it, and our own output has no excuse for being off. **Do not
make the encoder reproduce an issuer's arithmetic error**: we absorb drift when
reading and never emit it.

### Auto-version Selection
`getVersionForState(stateCode)` in `src/core/states.ts` maps each jurisdiction to its default AAMVA version. When a user selects a state, `useFormStore.setStateVersion()` rebuilds the field list accordingly.

### State Themes
`applyStateThemeToDocument(stateCode)` sets CSS custom properties (`--color-primary`, `--color-accent`, etc.) on `<html>` derived from `STATE_THEMES` in `src/core/stateThemes.ts`. All 54 jurisdictions have curated palettes.

**Every `--state-*` surface variable is a light tint** — `surface` is literally `#ffffff`, `input` and `background` are near-white mixes. `data-state-theme` is set for every jurisdiction regardless of the color scheme, because the jurisdiction and the light/dark preference are independent choices. So any rule that paints a background or border with one of them must be scoped `html[data-state-theme]:not(.dark)`, with a `html[data-state-theme].dark` counterpart that mixes the hue *into* the dark surface (`color-mix(in srgb, var(--state-primary) 14%, #2c2c2c)`) rather than replacing it. Unscoped, they render near-white panels under the near-white text `html.dark` has already chosen — the form's own text boxes sat at 1.03:1. `src/tests/themeSurfaces.test.ts` checks the stylesheet for unscoped light surfaces; `e2e/dark-contrast.spec.ts` measures what the browser actually paints.

Form fields carry validation state in their border, so the themed rules set only the *fill* on `.dmv-main input/select/textarea`. An `!important` border-color there repaints every red and amber edge in the jurisdiction's color.

### Kiosk scale and typography

The UI is sized for a thumb and read at arm's length. The scale lives in two
places that must not drift: custom properties at the top of `src/styles/index.css`
and the matching Tailwind theme keys in `tailwind.config.js`.

| Token | Value | What it is |
|---|---|---|
| `h-k-control` | 56px | Primary control height — inputs, selects |
| `h-k-touch` | 44px | The floor. Nothing interactive may be smaller |
| `text-k-value` | 18px | What the user typed |
| `text-k-label` | 15px | Field label |
| `text-k-help` | 13.5px | Hint, advisory, counter |
| `text-k-section` | 30px | Section heading |
| `rounded-k` / `rounded-k-lg` | 10px / 14px | The only two radii |

Two faces, both self-hosted variable woff2 under `src/assets/fonts/`, both
SIL OFL 1.1 with their licences shipped beside them:

- **Atkinson Hyperlegible Next** for everything. It was drawn by the Braille
  Institute to pull confusable characters apart — `0`/`O`, `1`/`l`/`I`, `8`/`B`.
  That is a correctness property here, not an aesthetic one: this is a
  data-entry form for identity documents, and reading a licence number's `O` as
  a `0` produces a credential for nobody.
- **JetBrains Mono** (slashed zero) for field codes, dates, and the raw payload.

They are imported from `src/assets/` rather than dropped in `public/` so Vite
hashes them and emits **relative** URLs. That is what keeps them resolvable
under `base: './'` at a Pages subpath, from a domain root, and from Electron's
`file://`. A `public/fonts/` copy would force an absolute `/fonts/` path and
break the first two. They also join the service-worker precache
(`inject-sw-precache-manifest` in `vite.config.mts` globs `woff2`), because
cache-first would only pick them up after a successful request — an installed
iOS app whose first launch is offline would otherwise sit on the fallback face
with no way to recover.

### Section navigation, and what "filtering" switches on

`App.tsx` renders **one field group at a time**, chosen by `activeSection` and
driven by `StepRail`. The moment a search or a filter is active
(`isFiltering`), it switches back to the whole-form view: every match across
every section, each run labelled by `FieldGroup`. Paginating search results by
section would mean hunting for the section holding your match, which is the
thing you searched to avoid.

Anything that jumps to a field must go through `handleScrollToField`. The target
is almost never on the open rung, and an unmounted input cannot be focused, so
that handler sets the section and hands the code to `pendingFocusRef`; an effect
retries each commit until the input exists. **Do not** replace that with a
`requestAnimationFrame` from the click handler — a rAF can run before React
commits the new section, `getElementById` returns null for an input that is
about to exist, and the jump silently does nothing.

### Empty is not an error

`ValidationIssue` carries `kind`. Both `"empty"` and `"invalid"` are
`severity: "error"` and both block generation — the *gate* does not care. Every
place that **counts or colours** them must:

- say "N to fill" about `"empty"`, in a neutral colour;
- reserve red and the word "error" for `"invalid"`.

This is not cosmetic. Conflating them opened a form nobody had touched with 174
red elements and a "20 errors" badge, which taught users that red means nothing.
`scripts/ui-audit.mjs` counts red elements on a pristine form so the regression
is visible; the honest floor is a destructive control plus the required markers.

### Strict Mode
When enabled, validation warnings are treated as errors and block payload generation. Controlled by `setStrictMode()` in the Zustand store.

Two warning channels feed that promise and both are enforced at generation time:

- **Cross-field** warnings from `validateCrossFieldConsistency` (date ordering, validity span, age at issue).
- **Per-field** advisories from the jurisdiction rule packs in `jurisdictionRules.ts`. `evaluateFieldValue` promotes these from `warning` to `error` when `strictMode` is set, and `generateAAMVAPayload` refuses to build.

`validateFieldValue` deliberately takes no strict-mode parameter — its checks (enumerations, length limits, jurisdiction validators, type formats) are never advisory. Severity lives in `evaluateFieldValue`.

### Auto-Generated Fields
`generateAAMVAPayload`'s `autoGenerateDiscriminator` option may only invent `DCF` (document discriminator) and `DDB` (card revision date) — see `AUTO_GENERATED_CODES` in `generator.ts`. **`DAQ` is never auto-generated**: it is the cardholder's real customer/licence number, it is mandatory in every version, and filling it in silently both put a fictional identifier into the barcode and defeated the missing-mandatory-field check.

`generateAAMVAPayload` does not mutate the object it is given. Auto-filled values are visible in the returned payload (decode it), not in the caller's map.

`usePayload` caches the values it auto-fills — both keyed on jurisdiction + issue date — so the payload stays stable across keystrokes instead of re-rolling on every debounce. `DCF` is keyed on the issue date too because some issuers derive it from that date (Connecticut prefixes it with the issue date as `YYMMDD`), and a `DCF` cached across a `DBD` edit would contradict the date printed beside it.

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
- **Do not** paint a background or border with a `--state-*` variable without scoping it away from `html.dark` — every palette is a light tint (see State Themes above)
- **Do not** select a bare `button` under `.header-identity` in a themed rule — use `.header-ctrl`. Those are descendant selectors and a popover *anchored* to the identity row is not *on* it; every palette sets `onPrimary: #ffffff`, so a `button` selector painted the whole **More actions** menu white-on-white at 1.00:1. `e2e/header-popovers.spec.ts` measures both header menus on a phone
- **Do not** pair `text-gray-400` with `dark:text-gray-500` — that combination is below AA in *both* themes; `text-gray-500 dark:text-gray-400` clears it in both
- **Do not** dismiss a popover on the trigger's `blur` alone — clicking a `<button>` does not focus it in Safari or Firefox, so the popover never closes (see `FieldInput.tsx`)
- **Do not** assume the first subfile starts at byte 31 — the directory grows with the entry count; read `21 + entries × 10`
- **Do not** write jurisdiction (`Z*`) elements into the `DL`/`ID` subfile, and do not add them to `AAMVA_VERSIONS` — they belong to one jurisdiction, not to the standard
- **Do not** upper-case jurisdiction (`Z*`) values — they are opaque, and NY's `ZNB` is mixed-case
- **Do not** hardcode the jurisdiction version to `"00"` — it is per-issuer and lives in the encoding profile
- **Do not** count a blank required field as an "error" in any badge, chip or report — see *Empty is not an error*
- **Do not** ship an interactive control under 44px, or a control border under 3:1 against **both** its fill and the surface behind it (WCAG 1.4.11); `scripts/ui-audit.mjs` checks both
- **Do not** paint text on `--state-gradient` — it runs from the jurisdiction's primary to its *accent*, a light hue, and white on California's accent measures 2.0:1
- **Do not** move the fonts to `public/` or add a `fonts.googleapis.com` link — the CSP is `style-src 'self'` and `base: './'` needs relative URLs
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
