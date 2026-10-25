# Public specimen intake

`2026-10-25.json` records 291 inspected image assets across 53 jurisdictions,
73 retained source documents, and 26 distinct PDF417 payloads across 12
jurisdictions. ZXing-C++ 3.1.1 recovered every payload from published pixels;
each saved evidence crop was decoded again and compared with its binary file.

The images include card fronts, backs, permits, comparison sheets, interim
documents and calibration symbols. An asset count is not a count of distinct
designs. Public specimens can differ from issued credentials and can contain
placeholders, obsolete formats or internally inconsistent examples.

## Local artwork

The accompanying `AAMVA_Conformance_Investigation_2026-10-25` package contains the
offline coverage report, searchable gallery, original sources, specimen images
and independently checked evidence crops. Put its contents in the ignored
`.corpus-cache/public-specimens-2026-10-25/` directory to resolve relative paths.
Artwork stays outside public Git history while publisher reuse terms remain
unreviewed. Washington's existing unchanged images retain their validation-aid
purpose limitation in the metadata.

New sources include Illinois's Central Issuance brochure, an archived public
Arkansas calibration publication, a Guam specimen brochure, E-Verify factsheets,
Minnesota publications, and public specimen fronts republished in a federal
report. Publisher classes distinguish issuing agencies, archives, federal
republications and a public university's reference guide. The Arkansas capture
dates to September 19, 2020; its current live URL returns 404.

## What passes

Three recovered payloads now also have passing encoder vectors:

| Reference       | Bytes | Source fidelity           |
| --------------- | ----: | ------------------------- |
| Arkansas v09 DL |   310 | Unmodified source payload |
| Georgia v09 DL  |   400 | Unmodified source payload |
| Illinois v08 DL |   354 | Unmodified source payload |

The observed profiles preserve source order, jurisdiction subfiles, separators
and height-unit letter case where applicable. Georgia's sample dates trigger
the existing validity-window advisory in strict mode. Its fixture uses the
normal generator with validation enabled. These references establish the
observed layouts only.

Across all 26 observations, the current comparison records three exact matches,
11 different outputs, eight rejected sample inputs and four observations that
stop at the decoder. The manifest identifies the comparison's base commit and
engine source hashes; it does not imply every difference is a generator defect.

`publishedSpecimens.test.ts` checks all 26 payload hashes and the independently
read fields for the 22 observations accepted by the application decoder.
Legacy and malformed samples remain available without assertions requiring
their rejection forever.

```sh
npm run test:run -- src/tests/publishedSpecimens.test.ts src/tests/conformance.test.ts
node scripts/published-specimen-report.mjs
npm run conformance:report
```

## Open evidence gaps

American Samoa and Puerto Rico still lack an in-scope image/reference addition.
Forty-three registry jurisdictions have no independently scanned public payload
in this intake. Fifty have no passing external encoder reference. The current
external references cover five jurisdiction/version/DL combinations and no ID
combination. Images of a card front cannot establish its encoded bytes.

The [coverage investigation](../COVERAGE-2026-10-25.md) documents parser gaps,
issuer-specific layouts, source placeholders, the newly published version 12
standard, and discrepancies in that standard's example. None of those open
items is counted as passing conformance.
