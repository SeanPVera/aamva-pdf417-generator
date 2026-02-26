# AAMVA Barcode Compliance Audit

Date: 2026-02-26
Scope: Static review of payload generator/validator/decoder and automated tests.

## Overall assessment

**Result: Partially compliant (good structural baseline, not certifiable).**

The project correctly constructs an ANSI/AAMVA-style payload header, builds a DL subfile directory entry, enforces many required fields by schema version, and has broad automated test coverage for core formatting behavior.

However, it is not a full compliance implementation because jurisdiction-specific business rules, full CDS validation rules, and production/certification controls are intentionally out of scope.

## What is compliant or strongly aligned

1. **AAMVA-style payload framing is present**
   - Payload uses compliance indicator `@`, separators, file type `ANSI `, IIN, version, and directory entry fields before the DL subfile. (`generateAAMVAPayload`) 
2. **Directory offset/length handling is byte-aware**
   - Uses `TextEncoder` to compute byte length and validates subfile size against 4-digit directory constraints.
3. **Versioned schema support (01–10)**
   - Version definitions include required/optional fields and version-specific constructs.
4. **Constrained value sets and basic validation**
   - Enumerated fields and length/date/zip/char checks are implemented.
5. **Regression test suite is extensive**
   - Includes tests for header structure, directory length alignment, date formats, ZIP padding, version-specific rules, and decoder round-trip behavior.

## Compliance gaps / risk areas

1. **Not government-certified / not production assurance**
   - Project documentation explicitly states it is not government-certified and uses lightweight validation.
2. **Validation is not fully jurisdiction-specific**
   - Current rules are schema-level and generic (format/length/required), not full state-level issuance rules.
3. **Single-subfile assumption**
   - Generator hardcodes one `DL` entry (`numEntries = "01"`) and does not support additional subfiles that may appear in broader AAMVA ecosystems.
4. **Decoder performs permissive parsing**
   - Decoder does not strongly verify all fixed header tokens/entry counts before parsing field lines.
5. **UI unsupported-territory behavior appears inconsistent with docs**
   - README says territories are disabled, but UI disables only entries where state metadata is `null`; territories in `AAMVA_STATES` are populated objects, so they are selectable.

## Recommended next steps (priority)

1. **Add strict header conformance checks**
   - Verify exact fixed bytes/tokens (`@`, separators, `ANSI `, directory count and bounds) during decode and optional pre-encode linting.
2. **Add compliance profile mode**
   - Introduce strict mode for field rules (e.g., per-version/per-jurisdiction constraints, forbidden characters, semantic date logic).
3. **Harden state/jurisdiction policy**
   - If territories are intentionally unsupported, encode this as explicit metadata flag and enforce it consistently in UI + payload generation.
4. **Expand negative tests for malformed payloads**
   - Add tests for invalid header tokens, inconsistent offsets/lengths, extra/missing separators, and non-DL primary entries.
5. **Publish a conformance matrix**
   - Track each AAMVA CDS requirement as Implemented / Partial / Not Implemented for transparent readiness.

## Commands run

- `npm test`

