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
- [x] Multi-subfile payloads: the header directory is written and read for N entries, not one, including jurisdiction-defined `Z*` subfiles. Connecticut ships one.
- [x] Per-jurisdiction encoding profiles recording where an issuer's wire format departs from the spec default (jurisdiction version, element order, postal-code padding, jurisdiction subfile). See `encoding` in `src/core/jurisdictionRules.ts`. Profiles exist for CT and NY, both from decoded cards.
- [x] Jurisdiction version number written from the issuer's profile rather than a hardcoded `00`.
- [x] Byte-level accounting for any payload: declared vs. accounted vs. unaccounted bytes per subfile, values that arrived space-filled, and elements outside the version's field table. See `src/core/inspect.ts` and the Wire Ledger panel.

## Remaining work to approach certification-readiness

- [ ] Jurisdiction-specific required/optional field overrides validated against authoritative source docs.
- [ ] Jurisdiction-specific format validators (e.g., ID patterns, edge-case date semantics).
- [ ] **Conformance vectors sourced from outside this implementation** (AAMVA-published test cards or anonymised issued credentials). Currently 1 of 55 jurisdictions — Connecticut, from a decoded issued credential; `npm run conformance:report` prints the live figure. For the other 54, no test in this repo can distinguish "our encoder is correct" from "our encoder is unchanged".
- [ ] Provenance and as-of dates on the jurisdiction data itself (IINs and default AAMVA version in `states.ts`, rule packs in `jurisdictionRules.ts`), which currently carry no source citations.
- [ ] A reproducible byte layout for the decoded New York card. Its header declares a 323-byte DL subfile where the elements visible in the decode account for 224. Testing narrowed this: padding to AAMVA-defined widths is **ruled out** — of the 38 subsets of NY's padding slack that sum to exactly 99, every one requires padding a field while leaving a same-class sibling short (`DCS`+`DAC` to 40 but not `DAD`; `DCB` but not `DCA`/`DCD`), and no encoder rule produces that. What remains is padding to NY's own widths, or elements the source dump's table did not render. Scanning a card through the Wire Ledger settles it. NY's other findings — jurisdiction version 04, the `ZN` subfile, `DDD`, the alphanumeric `DCF`, the feet-inches height — are recorded; the byte layout is not, and NY therefore has no `issued` conformance vector.
- [ ] A second reading of `DAK` padding. Both decoded cards show a bare 9-digit ZIP where the spec defines a fixed 11-character field, but only CT's layout could be confirmed byte-for-byte, so only CT is marked unpadded. If a third card agrees, the default should probably flip.
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
