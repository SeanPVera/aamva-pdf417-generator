# AAMVA Compliance Matrix (Implementation-Focused)

This matrix tracks implementation coverage in this repository. It is **not** a certification artifact.

## Current gates implemented

- [x] Payload framing and directory structure validation in strict mode.
- [x] Required field presence by schema version.
- [x] Jurisdiction profile version enforcement in strict mode.
- [x] Cross-field date chronology checks (birth/issue/expiry).
- [x] Strict-mode blocking of warning-level cross-field issues.
- [x] Supported-jurisdiction strict generation smoke test coverage.
- [x] Independent read-back of the rendered symbol: every jurisdiction's barcode is decoded by ZXing (an implementation unrelated to ours) and compared byte-for-byte with the payload. See `src/tests/scanOracle.test.ts`.
- [x] Provenance tiers on every conformance vector, so self-generated baselines cannot be mistaken for external evidence. See `src/core/conformance/README.md`.

## Remaining work to approach certification-readiness

- [ ] Jurisdiction-specific required/optional field overrides validated against authoritative source docs.
- [ ] Jurisdiction-specific format validators (e.g., ID patterns, edge-case date semantics).
- [ ] **Conformance vectors sourced from outside this implementation** (AAMVA-published test cards or anonymised issued credentials). Currently 0 of 55 jurisdictions; `npm run conformance:report` prints the live figure. Until this is non-zero, no test in this repo can distinguish "our encoder is correct" from "our encoder is unchanged".
- [ ] Provenance and as-of dates on the jurisdiction data itself (IINs and default AAMVA version in `states.ts`, rule packs in `jurisdictionRules.ts`), which currently carry no source citations.
- [ ] Scanner interoperability matrix across major decoding engines and mobile/desktop devices (the ZXing oracle covers one engine, in software, at ideal contrast).
- [ ] Formal release evidence package (traceability from requirement -> test -> release).
- [ ] External legal/compliance review and acceptance criteria sign-off.

## How to run current compliance checks

```bash
npx vitest run src/tests/complianceProfile.test.ts
npx vitest run src/tests/strictComplianceMatrix.test.ts
npx vitest run src/tests/scanOracle.test.ts          # independent barcode read-back
npx vitest run src/tests/conformanceProvenance.test.ts
npm run conformance:report                           # real-world coverage figure
```
