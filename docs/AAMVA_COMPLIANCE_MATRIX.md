# AAMVA compliance evidence

As of October 31, 2026, the implementation has passing external fixtures for **15/55 jurisdictions**, plus standards-based version 12 checks across all 55. The all-jurisdiction issuer-reference objective remains open. This is an implementation evidence matrix; certification has not been established.

| Check | Evidence | Limit |
| --- | --- | --- |
| IIN assignments | All 55 match the captured primary AAMVA registry | Default edition values remain application profile assumptions |
| External byte comparisons | 29 references, 15 jurisdictions, 19 state/version/type combinations | 24 source-exact, 2 anonymized, 3 canonicalized |
| Public observation intake | 41 unique decoded payloads from 24 jurisdictions | Source defects remain visible and excluded from passing claims |
| Version 12 | 2026 active fields, DL/ID applicability, Latin-1 wire bytes, SIG/SCV handling | Zero independently sourced issuer v12 references |
| Independent normative oracle | Python-built v12 DL and ID expectations for every jurisdiction | Synthetic standards evidence |
| Rendered symbols | ZXing read-back for corpus fixtures, default strict profiles, and all 110 v12 expectations | Ideal digital images; no device or printed-card certification |
| Signatures | P-256/SHA-256, 64-byte raw signatures, 80-character ASCII85, full and partial coverage | Caller-supplied key only; issuer certificate trust remains external |
| Legacy decoding | v01 headers, observed separator, prefix space, directory drift, recorded source diagnostics | Strict validation preserves malformed-source rejection |
| Preservation | Original corpus inputs and expected bytes retained; source framing transformations explicit | Anonymized and canonicalized layouts remain distinct from raw source parity |

See the [55-jurisdiction coverage ledger and source qualifications](../src/core/conformance/COVERAGE-2026-10-31.md) and [machine-readable ledger](../src/core/conformance/coverage-ledger-2026-10-31.json). The [October 25 investigation](../src/core/conformance/COVERAGE-2026-10-25.md) remains a historical snapshot.

Named observed encoding profiles apply only to their matching issuer, edition, and document type. They preserve unusual field order, fixed padding, empty elements, historical fields, and opaque jurisdiction subfiles without replacing generic defaults. Compatibility exceptions appear in their notes.

Remaining evidence work includes passing source references for the other 40 jurisdictions, additional editions and ID cards within covered jurisdictions, signed issuer v12 payloads with trusted public certificates, scanner/device interoperability, and physical print assessment. The current corpus contains one ID combination, Virginia v10. A passing DL fixture establishes no ID layout.

Run `npm run conformance:report` for the current inventory, then `npm run test:run` and `npm run test:coverage` for exercised comparisons. Static validation, production build, formatting, and bundle budgets are separate release checks.
