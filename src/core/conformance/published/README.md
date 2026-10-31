# Public specimen intake

The combined intake retains **41 unique independently decoded public payloads across 24 jurisdictions**. Passing external source-layout coverage comes from `../vectors/`: 29 references across 15 of 55 jurisdictions, including 24 unmodified source matches. Twelve jurisdictions have an unmodified public source match. Issued anonymized and mechanically canonicalized references remain separately labelled.

| Manifest | Unique payloads added | Scope |
| --- | ---: | --- |
| `2026-10-25.json` | 26 | Historical intake from 291 inspected images, 73 retained source documents, and 53 jurisdictions with visual additions |
| `2026-10-31.json` | 9 | Additional public calibration sheets, brochures, archives, and qualified rehosts |
| `2026-10-31-continuation.json` | 6 | Colorado, Montana, historical Florida, and negative Montana, California, and Illinois observations |

The first two manifests remain byte-identical to the preceding checkpoint. Their recorded decoder and encoder outcomes describe that checkpoint. The current comparison appears in the [October 31 coverage ledger](../coverage-ledger-2026-10-31.json).

## Current comparison

The parser accepts 37 of the 41 observations. The encoder reproduces 24 original source payloads exactly and matches two explicitly canonicalized published layouts. Eleven source inputs fail field validation. Two observations have malformed framing and two have quarantined source conflicts. These outcomes account for all 41 observations; a failed specimen never increases passing coverage.

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

Source bytes are independently recovered by ZXing-C++ 3.1.1. Each shared crop must decode again to the same binary payload. Re-encoding a payload and reading it back is a separate check and supplies no independent issuer provenance.

```sh
npm run test:run
npm run conformance:report
```

## Remaining evidence

Forty configured jurisdictions lack a passing external fixture. Additional editions and ID types remain open within the covered jurisdictions. The v12 normative oracle contains 110 independently assembled synthetic expectations and contributes zero external jurisdiction coverage. No signed issuer-derived v12 payload is verified.
