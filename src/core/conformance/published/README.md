# Public specimen intake

The combined intake retains **47 unique independently decoded public payloads from publications labelled for 27 jurisdictions**. The [passing corpus](../COVERAGE-2026-11-19.md) contains 35 external references across 19 of 55 jurisdictions. Twenty-eight reproduce unmodified public source bytes from 15 jurisdictions.

| Manifest | Unique payloads added | Scope |
| --- | ---: | --- |
| `2026-10-25.json` | 26 | Historical intake from 291 inspected images, 73 retained source documents, and 53 jurisdictions with visual additions |
| `2026-10-31.json` | 9 | Additional public calibration sheets, brochures, archives, and qualified rehosts |
| `2026-10-31-continuation.json` | 6 | Colorado, Montana, historical Florida, and negative Montana, California, and Illinois observations |
| `2026-11-19.json` | 6 | Two California DMV tests, historical Oklahoma and Texas DL backs, and negative New Hampshire and West Virginia specimens |

## Current comparison

The application parses 42 of the 47 published observations. The encoder reproduces 28 original payloads and matches two mechanically canonicalized layouts. Twelve inputs fail field validation, three have malformed framing, and two have publisher or content conflicts. The [November ledger](../coverage-ledger-2026-11-19.json) records each result. The dates in prior manifests identify the software checkpoint at acquisition.

## October 31 continuation

The continuation promotes three reviewed unmodified source fixtures:

| Source layout | Bytes | Publishing qualification |
| --- | ---: | --- |
| Colorado v10 DL | 318 | University of Denver verification-guide rehost; legislative source corroborates artwork only |
| Montana v08 DL | 386 | Scanner-vendor rehost of a government brochure; government copy has different pixels and did not decode |
| Florida v01 DL | 419 | Public training-guide rehost; direct issuer origin unverified |

Montana's discriminator exceeds the shared field limit, and some printed face values differ from its barcode. The named profile reproduces that observed departure. Colorado's adjacent printed face is an older edition than the recovered back. Historical Florida uses a separated identifier with an edition-specific pattern. Full hashes, capture locations, original bytes, and qualifications appear in each vector and `observed-profile-provenance.json`.

The negative Montana and California templates retain the literal `MMDDCCYY` revision placeholder. The additional Illinois source lacks a final terminator. A separate California decode exposed personal data behind dummy artwork; only its exclusion hash remains. Full third-party training PDFs containing unreviewed examples are excluded from the shared evidence package. Public gallery labels that disagree with the barcode's issuer are quarantined and contribute no coverage.

## Local evidence

The offline investigation packages retain approved specimen crops, binary payloads, hashes, source documents where reviewed, and acquisition receipts. Artwork remains outside public Git history while publisher reuse terms remain unreviewed. Existing Washington images retain their validation-aid purpose limitation.

ZXing-C++ 3.1.1 recovered the source bytes. Apple Vision also read all six November specimen crops. Its decoded text encoded as ISO-8859-1 has the same SHA-256 as the ZXing-C++ bytes for each crop. Each shared crop must decode again to the same binary payload. Re-encoding a payload and reading it back is a separate check and supplies no independent issuer provenance.

```sh
npm run test:run
npm run conformance:report
```

## Remaining evidence

Thirty-six configured jurisdictions lack a passing external fixture. Additional editions and ID types remain open within the covered jurisdictions. The v12 normative oracle contains 110 independently assembled synthetic expectations and contributes zero external jurisdiction coverage. No signed issuer-derived v12 payload is verified.
