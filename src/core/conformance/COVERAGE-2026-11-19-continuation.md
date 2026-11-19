# November 19 continuation

Hawaii, Maryland, Minnesota, Oregon, Guam and New Jersey raise coverage from 19 to **25 of 55 jurisdictions**. The corpus contains 41 passing external fixtures across 29 jurisdiction, edition and document-type combinations. Of the retained fixtures, 31 preserve original source bytes across 18 jurisdictions, five are anonymized and five use documented framing corrections. Issuer-derived v12 coverage is 0/55.

## Maryland

The Maryland Motor Vehicle Administration's January 21, 2026 Senate Bill 87 exhibit labels the sample, shows its front on page 2 and its back on page 3. The hearing packet repeats the same native image. ZXing-C++ and Apple Vision agreed on the 299-byte payload. Its IIN resolves to Maryland and the primary subfile is ID. The ordinary encoder initially produced 282 bytes. The source-specific profile preserves the field order, both subfile boundaries and the opaque ZMA element. It reproduced all 299 original bytes in memory. [MVA exhibit](https://mgaleg.maryland.gov/cmte_testimony/2026/jpr/1LwDcj7N3FMK5jv1NLPfB56SDDmzer7U7.pdf) · [Hearing packet](https://mgaleg.maryland.gov/cmte_testimony/2026/jpr/32247_01202026_10816-302.pdf)

The publisher obscured information on the printed front. The shareable fixture replaces six value spans, preserving their byte lengths. All remaining bytes come from the independent decode. The encoder also reproduced the anonymized payload exactly. The intake identifies the SHA-256 for each payload and the document-preview files we inspected. [Public intake and source replays](published/2026-11-19-continuation.json) · [Shareable fixture](vectors/md-mdot-sb87-2026-v09-id-anonymized.json)

## Additional specimens

| Issuer and edition | Verified result | Publication |
| --- | --- | --- |
| Hawaii v10 DL | All 336 original bytes match. The directory calls its second subfile ZA, whose elements are ZHA and ZHC. The sample on the printed front matches the encoded identity. | [Honolulu Department of Customer Services, page 1](https://www.honolulu.gov/csd/wp-content/uploads/sites/6/2026/02/HI-DLID-LeafletBrochure-v3b-Feb2026-onlineversion.pdf) |
| Minnesota v01 DL | All 101 original bytes match. The DVS guide, effective December 15, 2004, lists the name, birth date and card number. These are the three fields on the wire. The named historical profile applies to this documented sparse layout. | [DVS guide, beverage association rehost, page 2](http://municipalbev.com/images/driverslicense.pdf) |
| Oregon v09 DL | All 326 original bytes match. The state rebate guide shows both faces marked SAMPLE. The 479 × 301 back required optical recovery. Twenty-six grid fits yielded identical payloads. Three decoders agreed after shared preprocessing. | [Oregon rebate program, page 3](https://evrebate.oregon.gov/sites/default/files/docs/SampleSupportingDocuments_OCVRP.pdf) |
| Guam v05 DL | All 236 bytes of the corrected layout match. The source contains 260 bytes. Its final CR is missing and 25 bytes of vendor sample text follow the declared subfile. Two documented edits correct framing and preserve every field. Its header IIN belongs to Guam and DAJ gives an Indiana address. The vendor repeated the back on multiple specimen faces. | [Guam Department of Revenue and Taxation, page 1](https://www.guamtax.com/notices/Guam_D500BrochureProd.pdf) |
| New Jersey v04 DL | The public 487-byte previous-format sample lacks its last carriage return. Appending that byte and changing its four-digit ZN length from 0131 to 0132 produces the 488-byte passing reference. The older specimen and nine different MVC printouts contain DDA=B. Its meaning remains unverified. | [NJLBA training deck, slide 5](https://www.njlba.com/pdfs/NJDL-NEW%20LICENSE-TRAINING-2020.pdf) · [MVC training samples, pp. 2–10](https://www.nj.gov/mvc/pdf/about/2019_04.pdf) |

## Eight jurisdictions with existing matching-issuer bytes

All eight original images returned their recorded byte lengths and SHA-256 values on a fresh optical read. The table distinguishes the original result from a controlled test on a copy. Date substitutions are the same width as the printed placeholder. The Michigan test independently calculates the directory changes required by seven longer values. Each comparison uses the ordinary generator with the observed layout selected. The six controlled comparisons stay outside the external-positive count.

| Jurisdiction | Original result | Controlled test or additional evidence |
| --- | --- | --- |
| DE v09 DL | DDB contains the literal date template | Supplying a numeric DDB reproduces the 390-byte layout, including all three empty ZD elements. |
| IN v04 DL | DDB contains the date template | A numeric DDB reproduces the 672-byte layout including padding and seven ZI elements. |
| MI v10 DL | The public retailer sheet leaves seven mandatory values blank | Filling precisely those seven fields reproduces every other field and both recalculated directory entries. |
| MS v10 DL | DDB contains the date template | Changing those eight bytes reproduces all 403 bytes of the controlled case. A separate v01 flyer yielded a distinct 252-byte payload, retained by digest because the encoded subject could not be attributed to the example on its front. |
| NH v10 DL | A subfile starting at offset 31 claims all 485 bytes | Only 454 bytes are available. Three fields exceed the edition's limits even after correcting the length for inspection. |
| NJ v04 DL | Leading space, a shifted subfile boundary, overlong privilege fields and a DDB template | The 2011 MVC advisory repeats the known 687 bytes. Nine different interim specimens in the 2019 MVC advisory carry B as the compliance value and leave restriction codes blank. A tenth specimen in a 2020 retailer deck carries B and lacks its final ZN terminator. All ten originals remain in the intake. The 487-byte retailer specimen independently supplies every field in the corrected 488-byte reference. Its named historical profile accepts the observed B without assigning a meaning. The nine interim originals remain negative cases. |
| SD v04 DL | Both DDB and DDC contain date templates | Numeric dates reproduce the 625-byte layout, including the ZS subfile. |
| WV v09 DL | Both DDB and DDC contain date templates | Numeric dates reproduce the 407-byte layout, including ZW. The public sheet is labeled for ID cards, while the barcode declares DL. |

## Additional matching-issuer source bytes

The [archived Iowa DOT brochure, page 2](https://web.archive.org/web/20230530162545id_/https://www.iowadot.gov/mvd/MM353.pdf) supplies a 584-byte v04 DL. Apple Vision and ZXing-C++ agreed on the original source. Its revision date contains the literal format string MMDDCCYY. Substituting only those eight bytes on a test copy reproduces the rest of the layout. The adult and under-21 temporary samples have distinct SHA-256 values. All six examined back images across four archive captures yielded one of those two payloads, each with the same date template. Iowa stays outside the passing count.

The [archived Idaho Transportation Department publication](https://web.archive.org/web/20160416004158id_/http://itd.idaho.gov/dmv/driverservices/documents/CentralIssuanceBrochure.pdf) supplies a 622-byte temporary v04 DL. The original includes a leading space, conflicting directory boundaries, a patterned hair-color value, and two date templates. Two readers agreed on the original bytes. A 612-byte controlled projection verifies the remaining source layout. Idaho stays outside the passing count.

The [300 dpi Nevada DMV sample back](https://web.archive.org/web/20170113222345id_/http://dmvnv.com/images/adultback_300dpi.jpg) yields 564 bytes, v03 DL. The marked demonstration data include three zero dates, two placeholder colors and a blank mandatory height. Strict framing passes. An equal-width control replaces only those six values and the normal generator reproduces the control exactly. The sample front depicts a different fictitious identity. Nevada stays outside the passing count.

The [Massachusetts RMV manual](https://www.mass.gov/files/documents/2018/03/21/Drivers_Manual.pdf) contains two independently recovered sample backs on page 168. The 631-byte v03 DL has a blank required eye color. The 621-byte v08 DL uses two literal age-threshold date masks and an extra separator. Three readers agreed after shared optical reconstruction. Field-level regression controls reproduce the rest of each source, with the extra separator and both affected directory values explicitly corrected in the v08 control. Massachusetts remains outside the passing count.

## Edition rules verified in the application

Annex D permits unabbreviated hair colors in DAZ from v04 through v12. Those editions accept BROWN and the abbreviated value BRO, while Idaho’s patterned sample value remains invalid.

The encoder now preserves the DL-only HAZMAT expiry date DDC in v04 through v10, the limited-duration indicator DDD from v04 and the optional age-threshold dates DDH, DDI and DDJ from v05. The v11 and v12 editions reserve DDC. Older editions v04 through v08 recognize the compliance value M. The dated field DDB is required when a card claims DHS compliance. Strict parsing now checks the final carriage return in a jurisdiction subfile. The new and historical regression cases cover these boundaries. [Archived AAMVA editions](https://drive.proton.me/urls/81RZ8Y239R#HQTtOXA2pOGd) · [AAMVA 2020 standard](https://www.aamva.org/getmedia/99ac7057-0f4d-4461-b0a2-3a5532e1b35c/AAMVA-2020-DLID-Card-Design-Standard.pdf) · [AAMVA 2026 standard](https://www.aamva.org/getmedia/feab821e-baa5-4524-b865-3eb172b51acd/2026-DLID-Card-Design-Standard.pdf)

## Open jurisdictions

AL, AK, AZ, DE, ID, IN, IA, KY, LA, MA, MI, MS, NV, NH, NM, NC, ND, OH, RI, SD, TN, UT, VT, WV, WI, WY, DC, AS, VI and PR still need a qualifying external fixture. Additional issue years, document types and v12 samples remain open even in jurisdictions with a passing fixture. [Earlier 55-jurisdiction ledger](coverage-ledger-2026-11-19.json)
