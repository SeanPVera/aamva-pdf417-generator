# Project Improvement Review

This document summarizes a fresh cross-cutting review of the current codebase and proposes practical improvements, grouped by priority.

## High-priority improvements

1. **Split large browser globals into modules**
   - `aamva.js` and `js/app.js` currently host most business logic and UI orchestration in large files attached to `window` globals.
   - Recommendation:
     - Extract `aamva.js` into focused modules (`state-registry`, `schemas`, `validation`, `payload-generator`).
     - Extract `js/app.js` into `state-store`, `form-renderer`, `barcode-renderer`, `imports-exports`, and `history` modules.
     - Keep a thin bootstrap entrypoint that wires modules together.
   - Benefit: better testability, lower regression risk, easier onboarding.

2. **Add formal linting + formatting gates**
   - The project has tests, but no lint/format scripts in `package.json`.
   - Recommendation:
     - Add ESLint + Prettier and enforce via scripts: `lint`, `format`, `format:check`.
     - Add CI checks to run lint + tests on PRs.
   - Benefit: fewer style drift issues, catches unused vars/dead branches early.

3. **Harden Electron runtime security posture**
   - Current `main.js` defaults are mostly good (`contextIsolation`, `nodeIntegration: false`, `sandbox: true`), but there is no visible CSP layer in `index.html` and no explicit navigation hardening hooks.
   - Recommendation:
     - Add a strict Content Security Policy in `index.html`.
     - In `main.js`, disallow unexpected navigations/window opens (e.g., `setWindowOpenHandler` + navigation guards).
   - Benefit: stronger defense-in-depth for packaged desktop builds.

4. **Tighten import/export validation pathways**
   - JSON import accepts only extension check and runtime parsing; error messaging is intentionally generic.
   - Recommendation:
     - Add schema-level JSON validation before applying to UI state.
     - Distinguish parse error vs schema error vs unsupported field error.
     - Add max file-size guardrail and normalize key casing.
   - Benefit: safer, more predictable import behavior and better UX.

## Medium-priority improvements

5. **Improve state management consistency**
   - State is spread across multiple mutable globals (`currentState`, `currentVersion`, `currentFields`, history stack).
   - Recommendation:
     - Introduce a single state object with immutable updates and explicit actions.
     - Centralize side effects (render, persist, history snapshot) behind action dispatch.
   - Benefit: easier debugging and fewer race/order bugs.

6. **Strengthen test breadth for UI behavior**
   - Current tests heavily exercise AAMVA data logic.
   - Recommendation:
     - Add DOM-level tests (e.g., JSDOM) for field rendering, restore-from-storage, unknown-field policy enforcement, and export preconditions.
     - Add golden test vectors for generated payloads across multiple versions/states.
   - Benefit: better confidence for refactors in `js/app.js`.

7. **Reduce duplication across version schemas**
   - Several schema versions repeat near-identical field arrays.
   - Recommendation:
     - Build version definitions from composable base arrays with additive/removal diffs.
     - Add tests asserting expected delta between consecutive versions.
   - Benefit: easier maintenance and fewer accidental divergence bugs.

8. **Stabilize accessibility affordances**
   - There are good ARIA labels and semantic sections, but room for incremental a11y polish.
   - Recommendation:
     - Ensure focus management after dynamic operations (import, clear form, undo/redo).
     - Add keyboard shortcut help text in UI and ensure controls are discoverable.
     - Validate contrast and focus indicators across all themes.
   - Benefit: better keyboard/screen-reader experience.

## Low-priority / quality-of-life improvements

9. **Refine logging strategy**
   - Startup logs are always printed in the browser console.
   - Recommendation:
     - Gate logs behind a debug flag and standardize structured logging helper.
   - Benefit: cleaner production console output.

10. **Add developer automation utilities**
    - Recommendation:
      - Add scripts for smoke validation (`test`, `lint`, optional headless render checks).
      - Add a small release checklist in docs (`npm ci`, `npm test`, build, manual verification).
    - Benefit: more repeatable local and release workflows.

11. **Add telemetry-free diagnostics export**
    - Recommendation:
      - Optional "Export diagnostics" button with app version, selected schema, and sanitized validation errors.
    - Benefit: easier issue reporting without collecting personal data.

## Proposed phased roadmap

### Phase 1 (quick wins)
- Add lint/format tooling and CI checks.
- Improve JSON import error granularity.
- Add debug flag for console logging.

### Phase 2 (stability)
- Introduce centralized state store/action model.
- Expand DOM-focused tests and payload golden vectors.
- Deduplicate schema definitions through shared bases.

### Phase 3 (hardening and polish)
- Add CSP + Electron navigation hardening.
- Complete accessibility pass and keyboard guidance.
- Add diagnostics export and release checklist.

## Suggested acceptance criteria for future PRs

- No new feature lands without tests covering its core logic path.
- Lint + tests pass in CI.
- Import paths reject malformed/oversized files with clear user-facing messages.
- Security baseline for Electron includes CSP and navigation restrictions.
- Accessibility checks performed for dynamic form updates and theme parity.
