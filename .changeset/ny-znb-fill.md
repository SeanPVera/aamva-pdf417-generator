---
"aamva-pdf417-generator": patch
---

Space-fill New York's `ZNB` to 90 characters, as a second decoded card shows.

`ZNB` is Ascii85 over what has the DER shape of an ECDSA signature, and DER makes that signature 70 to 72 bytes long, so `ZNB` runs 88 to 90 characters. The card behind the first NY vector filled the element to 90, or looked like it did. A second card's `ZNB` held 89 characters and then one space, and its `ZN` subfile still declared 120 bytes. Without the width, the generator wrote a 119-byte `ZN` subfile for any `ZNB` typed in without its trailing space, one byte short of what New York issues.

`ZNB: 90` is now in NY's `fieldWidths`, and a new `issued` vector (`ny-v10-dl-issued-znb-fill.json`, PII replaced) carries an 89-character `ZNB` so the width cannot silently regress. A scanned card was never affected: the decoder keeps a jurisdiction value's trailing spaces, so a scan re-encoded byte for byte before and after this change.
