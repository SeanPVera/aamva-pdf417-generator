# Project Review Notes

This document summarizes a code quality review focused on bugs, security, performance, and maintainability.

## Key recommendations

1. **Fix inconsistent date format validation and UX hints**
   - `js/app.js` date hint says `MMDDYYYY`, while `README.md` tells users to provide `YYYYMMDD` and tests validate `YYYYMMDD`.
   - Align on one canonical format across UI hints, validator comments, and docs.

2. **Remove or define `lastMatrix` in `clearForm()`**
   - `clearForm()` assigns `lastMatrix = null`, but no `lastMatrix` variable is defined in `js/app.js`.
   - In strict mode or bundling contexts, this can throw a `ReferenceError`.

3. **Harden decoder parsing by using directory offsets/lengths from header**
   - `decoder.js` finds the first `"DL"` after position 21 and parses from there, rather than honoring the directory entry.
   - Parsing should read the official directory offset/length to avoid false positives and improve compatibility.

4. **Tighten Electron renderer protections**
   - `main.js` already sets `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true` (great baseline).
   - Add `webSecurity: true`, disallow navigation/new windows (`will-navigate`, `setWindowOpenHandler`), and set a restrictive CSP in `index.html` for defense-in-depth.

5. **Improve export consistency and scaling determinism**
   - Preview and export use different scale rules, and PDF export uses fixed margins with no page-size control.
   - Consider deriving both preview and exports from one sizing function and generating PDF dimensions to fit the barcode without clipping/stretch.

6. **Reduce global-window coupling for maintainability**
   - `js/app.js` and `aamva.js` rely heavily on mutable `window.*` globals.
   - Introduce modules or namespaced objects with explicit dependency injection to improve testability and reduce accidental cross-file coupling.

7. **Strengthen test coverage for UI logic edge cases**
   - Existing tests are strong for schema/payload/decoder core behavior.
   - Add tests for: JSON import unknown-field rejection path, date picker conversion behavior, export column/scale computations, and localStorage restore fallback behavior.

8. **Constrain clipboard fallback and modernize copy flow**
   - The fallback `document.execCommand("copy")` path is deprecated.
   - Keep `navigator.clipboard` primary path and provide user-visible guidance if permission is denied, instead of silent fallback where unsupported.
