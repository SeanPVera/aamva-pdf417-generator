# Project Improvement Plan

## Scope and approach

This plan was built after reviewing the current project structure, docs, scripts, and core runtime code (`index.html`, `js/app.js`, `aamva.js`, `decoder.js`, and `test/aamva.test.js`).

## Executive summary

Top priorities:

1. **Fix test execution** so `npm test` runs successfully in CI/local.
2. **Align docs with code reality** (encoder implementation and test-suite status).
3. **Stabilize export/render sizing behavior** so preview and exported output are predictable.
4. **Introduce modular architecture boundaries** to reduce risk in future feature work.
5. **Add quality gates** (linting + automated browser smoke test).

## Findings and recommended improvements

### 1) Reliability and correctness

- `npm test` currently fails due to a missing source file import path (`../lib/pdf417.js`), blocking regression checks.
- `clearForm()` references `lastMatrix`, but that variable is not defined in `js/app.js`.
- PDF417 sizing logic is duplicated across preview and export paths, increasing drift risk.

**Recommended actions**
- Repair test bootstrap to import only existing runtime dependencies.
- Remove or properly define stale state references (`lastMatrix`).
- Extract sizing/column calculations into shared utility functions and unit-test them.

### 2) Documentation accuracy

- README references a custom encoder file path that does not exist in this repository.
- README states there is no automated test suite, but there is a `node:test` suite in `test/aamva.test.js`.

**Recommended actions**
- Keep architecture and limitations sections synchronized with the actual codebase.
- Add a short “maintenance checklist” in README for updating docs when dependencies/components change.

### 3) Test strategy and quality gates

- Current tests focus heavily on schema data validation, which is good coverage for AAMVA definitions.
- There is no CI configuration in the repository and no linting/static analysis step.
- No UI smoke tests for core flows (state/version selection, payload generation, export buttons).

**Recommended actions**
- Add CI job (GitHub Actions) for `npm ci` + `npm test`.
- Add ESLint (or Biome) with a lightweight baseline config.
- Add a browser smoke test (Playwright) for happy-path render/export interactions.

### 4) Front-end architecture

- `js/app.js` is doing many responsibilities: state management, rendering, validation, storage, history, export, and event wiring.
- This raises change coupling and onboarding cost.

**Recommended actions**
- Split `js/app.js` into modules:
  - `state-store.js`
  - `form-renderer.js`
  - `barcode-renderer.js`
  - `export-service.js`
  - `persistence.js`
- Add a single app bootstrap layer to compose modules.

### 5) UX/accessibility improvements

- App already includes useful ARIA labels and keyboard undo/redo support.
- Improvement opportunities:
  - Inline field-level validation messages (not only global error box).
  - Clear disabled-state/tooltips on unavailable export actions.
  - Better empty-state messaging for preview pane.

**Recommended actions**
- Add per-field error text regions linked with `aria-describedby`.
- Disable export buttons when no valid payload is rendered.
- Add status text for successful operations (copy/export).

### 6) Security and robustness hardening

- JSON import validates state/version but can be hardened further.
- Local storage restoration catches errors broadly (silent fallbacks), which can hide diagnostics.

**Recommended actions**
- Enforce schema-level whitelist on import in all modes.
- Add stricter type checks on imported values.
- Add non-intrusive debug logging toggles for restore/import errors.

## Prioritized roadmap

## Phase 0 (quick wins: same day)
- Fix failing test import path.
- Remove stale variable reference in `clearForm()`.
- Update README architecture/limitations statements.

## Phase 1 (1–2 days)
- Add CI workflow with `npm test`.
- Introduce linting + formatting script.
- Add unit tests for shared barcode sizing math.

## Phase 2 (2–4 days)
- Refactor `js/app.js` into focused modules.
- Add Playwright smoke tests for major user flows.
- Improve field-level validation UX.

## Phase 3 (ongoing)
- Expand AAMVA version/jurisdiction compliance tests.
- Add release checklist (docs parity, test pass, manual smoke).
- Track performance metrics for large payload editing and repeated re-renders.

## Success criteria

- `npm test` is green in local and CI.
- README accurately describes runtime components and test coverage.
- Preview/export sizing remains consistent across presets and custom settings.
- Core user journey has automated smoke test coverage.
- `js/app.js` complexity is reduced via modular boundaries.
