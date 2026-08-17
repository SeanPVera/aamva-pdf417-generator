---
"aamva-pdf417-generator": minor
---

Reproduce New York's byte layout exactly, and fix the ledger bug that was hiding it.

Running the wire ledger on a real New York credential returned two numbers that looked like missing data and were really one bug plus one discovery.

**The ledger dropped the last element of every subfile.** New York closes a subfile's final element with the segment terminator alone, no data element separator before it. The walk treated that tail as leftovers, so it reported 5 unaccounted bytes for the `DL` subfile — exactly one `DDD` element — and 94 for the `ZN` subfile — exactly one `ZNB` element with a 90-character blob. The elements were read correctly by the decoder throughout; only the accounting was wrong. Genuine leftovers are still reported as unparsed.

**The rest was padding, at New York's own widths.** 100 bytes of space fill across ten elements, and only four of the widths are the AAMVA ones: NY writes the name fields to 25 where the spec allows 40, and the vehicle class to 4 where it allows 6. That is why testing the gap against spec widths alone could never account for it — the earlier analysis correctly ruled those out, and the answer was a set of widths no spec document contains.

Both are now recorded in NY's encoding profile as `fieldWidths` and `omitFinalSeparator`, and the generator honours them. With the jurisdiction version already in place, our output now matches the source card's directory exactly: `DL` at offset 41 declaring 323 bytes, `ZN` at 364 declaring 120, 484 bytes total.

That unblocks the second `issued`-tier conformance vector (`ny-v10-dl-issued.json`, PII replaced), raising real-world jurisdiction coverage from 1 to 2.

`fieldWidths` generalises the older `padPostalCode` flag without replacing it: a recorded width wins, `DAK` otherwise falls back to the spec's fixed 11, and a value already at or over its width is written unchanged so padding can never truncate. Jurisdictions with no decoded card are unaffected.
