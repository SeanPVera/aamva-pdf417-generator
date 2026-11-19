# November 19 continuation

Maryland v09 ID raises coverage from 19 to **20 of 55 jurisdictions**. The corpus contains 36 passing external fixtures across 24 jurisdiction, edition and document-type combinations. Of the retained fixtures, 28 preserve original source bytes across 15 jurisdictions, five are anonymized and three use documented framing corrections. Issuer-derived v12 coverage is 0/55.

## Maryland

The Maryland Motor Vehicle Administration's January 21, 2026 Senate Bill 87 exhibit labels the sample, shows its front on page 2 and its back on page 3. The hearing packet repeats the same native image. ZXing-C++ and Apple Vision agreed on the 299-byte payload. Its IIN resolves to Maryland and the primary subfile is ID. The ordinary encoder initially produced 282 bytes. The source-specific profile preserves the field order, both subfile boundaries and the opaque ZMA element. It reproduced all 299 original bytes in memory. [MVA exhibit](https://mgaleg.maryland.gov/cmte_testimony/2026/jpr/1LwDcj7N3FMK5jv1NLPfB56SDDmzer7U7.pdf) · [Hearing packet](https://mgaleg.maryland.gov/cmte_testimony/2026/jpr/32247_01202026_10816-302.pdf)

The publisher obscured information on the printed front. The shareable fixture replaces six value spans, preserving their byte lengths. All remaining bytes come from the independent decode. The encoder also reproduced the anonymized payload exactly. The intake identifies the SHA-256 for each payload and the document-preview files we inspected. [Public intake and source replays](published/2026-11-19-continuation.json) · [Shareable fixture](vectors/md-mdot-sb87-2026-v09-id-anonymized.json)

## Eight jurisdictions with existing matching-issuer bytes

All eight original images returned their recorded byte lengths and SHA-256 values on a fresh optical read. The table distinguishes the original result from a controlled test on a copy. Date substitutions are the same width as the printed placeholder. The Michigan test independently calculates the directory changes required by seven longer values. Each comparison uses the ordinary generator with the observed layout selected. The six controlled comparisons stay outside the external-positive count.

| Jurisdiction | Original result | Controlled test or additional evidence |
| --- | --- | --- |
| DE v09 DL | DDB contains the literal date template | Supplying a numeric DDB reproduces the 390-byte layout, including all three empty ZD elements. |
| IN v04 DL | DDB contains the date template | A numeric DDB reproduces the 672-byte layout including padding and seven ZI elements. |
| MI v10 DL | The public retailer sheet leaves seven mandatory values blank | Filling precisely those seven fields reproduces every other field and both recalculated directory entries. |
| MS v10 DL | DDB contains the date template | Changing those eight bytes reproduces all 403 bytes of the controlled case. A separate v01 flyer yielded a distinct 252-byte payload, retained by digest because the encoded subject could not be attributed to the example on its front. |
| NH v10 DL | A subfile starting at offset 31 claims all 485 bytes | Only 454 bytes are available. Three fields exceed the edition's limits even after correcting the length for inspection. |
| NJ v04 DL | Leading space, a shifted subfile boundary, overlong privilege fields and a DDB template | MVC advisory 2011-001 independently repeats the same 687 bytes as the previously recorded manual. |
| SD v04 DL | Both DDB and DDC contain date templates | Numeric dates reproduce the 625-byte layout, including the ZS subfile. |
| WV v09 DL | Both DDB and DDC contain date templates | Numeric dates reproduce the 407-byte layout, including ZW. The public sheet is labeled for ID cards, while the barcode declares DL. |

## Edition rules verified in the application

The encoder now preserves the DL-only HAZMAT expiry date DDC in v04 through v10, the limited-duration indicator DDD from v04 and the optional age-threshold dates DDH, DDI and DDJ from v05. The v11 and v12 editions reserve DDC. Older editions v04 through v08 recognize the compliance value M. The dated field DDB is required when a card claims DHS compliance. Strict parsing now checks the final carriage return in a jurisdiction subfile. The new and historical regression cases cover these boundaries. [Archived AAMVA editions](https://drive.proton.me/urls/81RZ8Y239R#HQTtOXA2pOGd) · [AAMVA 2020 standard](https://www.aamva.org/getmedia/99ac7057-0f4d-4461-b0a2-3a5532e1b35c/AAMVA-2020-DLID-Card-Design-Standard.pdf) · [AAMVA 2026 standard](https://www.aamva.org/getmedia/feab821e-baa5-4524-b865-3eb172b51acd/2026-DLID-Card-Design-Standard.pdf)

## Open jurisdictions

AL, AK, AZ, DE, HI, ID, IN, IA, KY, LA, MA, MI, MS, MN, NV, NH, NJ, NM, NC, ND, OH, OR, RI, SD, TN, UT, VT, WV, WI, WY, DC, AS, GU, VI and PR still need a qualifying external fixture. Additional issue years, document types and v12 samples remain open even in jurisdictions with a passing fixture. [Earlier 55-jurisdiction ledger](coverage-ledger-2026-11-19.json)
