# AAMVA compliance evidence

On November 19, 2026, 41 external reference layouts pass byte comparisons across **25/55 jurisdictions**. The public intake also preserves source defects. The qualifications below describe the scope of each check.

| Check | Evidence | Limit |
| --- | --- | --- |
| IIN assignments | All 55 match the captured primary AAMVA registry | Default edition values remain application profile assumptions |
| External byte comparisons | 41 references, 25 jurisdictions, 29 state/version/type combinations | 31 unmodified source payloads across 18 jurisdictions, 5 anonymized, 5 canonicalized |
| Public observation intake | 67 retained raw payloads, an anonymized Maryland observation and additional hash-only exclusions | Source defects remain visible and excluded from passing claims |
| Version 12 | 2026 active fields, DL/ID applicability, Latin-1 wire bytes, SIG/SCV handling | Zero independently sourced issuer v12 references |
| Independent normative oracle | Python-built v12 DL and ID expectations for every jurisdiction | Synthetic standards evidence |
| Rendered symbols | ZXing read-back for corpus fixtures, default strict profiles, and all 110 v12 expectations | Ideal digital images; no device or printed-card certification |
| Signatures | P-256/SHA-256, 64-byte raw signatures, 80-character ASCII85, full and partial coverage | Caller-supplied key only; issuer certificate trust remains external |
| Legacy decoding | v01 headers, observed separator, prefix space, directory drift, recorded source diagnostics | Strict validation preserves malformed-source rejection |
| Preservation | Original corpus inputs and expected bytes retained; source framing transformations explicit | Anonymized and canonicalized layouts remain distinct from raw source parity |

See the [current continuation and eight source replays](../src/core/conformance/COVERAGE-2026-11-19-continuation.md), the [prior 55-jurisdiction coverage ledger and source qualifications](../src/core/conformance/COVERAGE-2026-11-19.md) and [machine-readable ledger](../src/core/conformance/coverage-ledger-2026-11-19.json). The [October 25 investigation](../src/core/conformance/COVERAGE-2026-10-25.md) remains a historical snapshot.

Named observed encoding profiles apply only to their matching issuer, edition, and document type. They preserve unusual field order, fixed padding, empty elements, historical fields, and opaque jurisdiction subfiles without replacing generic defaults. Compatibility exceptions appear in their notes.

Thirty jurisdictions still need a passing external fixture. Maine v09, Maryland v09 and Virginia v10 have ID references. Other editions and document types, signed issuer v12 payloads with trusted public certificates, scanner interoperability, and physical print quality remain open.

Run `npm run conformance:report` for the current inventory, then `npm run test:run` and `npm run test:coverage` for exercised comparisons. Static validation, production build, formatting, and bundle budgets are separate release checks.
