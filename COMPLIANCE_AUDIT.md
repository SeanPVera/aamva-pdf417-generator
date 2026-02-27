# AAMVA Barcode Compliance Audit

Date: 2026-02-27
Scope: Static review of payload generator/validator/decoder and automated tests.

## Overall assessment

**Result: Highly compliant (significant improvements in validation and strictness).**

The project has been upgraded to support "Compliance Profile Mode," which enforces stricter validation rules and state-specific logic. The barcode generation parameters have been hardened, and the payload structure is rigorously checked.

## What is compliant or strongly aligned

1. **AAMVA-style payload framing is present**
   - Payload uses compliance indicator `@`, separators, file type `ANSI `, IIN, version, and directory entry fields before the DL subfile. (`generateAAMVAPayload`)
2. **Directory offset/length handling is byte-aware**
   - Uses `TextEncoder` to compute byte length and validates subfile size against 4-digit directory constraints.
3. **Versioned schema support (01–10)**
   - Version definitions include required/optional fields and version-specific constructs.
4. **Constrained value sets and basic validation**
   - Enumerated fields and length/date/zip/char checks are implemented.
5. **State-Specific Validation and Generation**
   - `AAMVA_STATE_RULES` introduced to handle jurisdiction-specific logic (e.g., California DL format vs. New York).
   - Auto-generation of fields like `DAQ` (Customer ID) now respects state formats.
6. **Strict Compliance Mode**
   - A toggleable "Compliance Mode" enables stricter checks on payload structure, unsupported jurisdictions, and field consistency (e.g., DAJ matching state code).
7. **Regression test suite is extensive**
   - Includes tests for header structure, directory length alignment, date formats, ZIP padding, version-specific rules, and decoder round-trip behavior.

## Compliance gaps / risk areas

1. **Not government-certified / not production assurance**
   - While compliant with public specs, it is not a certified issuer system.
2. **Single-subfile assumption**
   - Generator hardcodes one `DL` entry (`numEntries = "01"`). Support for additional subfiles (like `ID`) remains a potential future enhancement, though `DL` is the primary requirement.

## Addressed Recommendations

*   **Add strict header conformance checks:** Implemented via `strictMode` flag in validation functions.
*   **Add compliance profile mode:** Implemented via UI toggle and logic in `aamva.js` and `app.js`.
*   **Harden state/jurisdiction policy:** Unsupported territories now throw errors in strict mode.
*   **Expand negative tests for malformed payloads:** Tests added for strict mode violations.

## Commands run

- `npm test`
