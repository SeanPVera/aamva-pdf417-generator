# AAMVA Compliance Matrix (Implementation-Focused)

This matrix tracks implementation coverage in this repository. It is **not** a certification artifact.

## Current gates implemented

- [x] Payload framing and directory structure validation in strict mode.
- [x] Required field presence by schema version.
- [x] Jurisdiction profile version enforcement in strict mode.
- [x] Cross-field date chronology checks (birth/issue/expiry).
- [x] Strict-mode blocking of warning-level cross-field issues.
- [x] Supported-jurisdiction strict generation smoke test coverage.

## Remaining work to approach certification-readiness

- [ ] Jurisdiction-specific required/optional field overrides validated against authoritative source docs.
- [ ] Jurisdiction-specific format validators (e.g., ID patterns, edge-case date semantics).
- [ ] Golden conformance vectors with expected pass/fail outcomes per jurisdiction/version.
- [ ] Scanner interoperability matrix across major decoding engines and mobile/desktop devices.
- [ ] Formal release evidence package (traceability from requirement -> test -> release).
- [ ] External legal/compliance review and acceptance criteria sign-off.

## How to run current compliance checks

```bash
npx vitest run src/tests/complianceProfile.test.ts
npx vitest run src/tests/strictComplianceMatrix.test.ts
```
