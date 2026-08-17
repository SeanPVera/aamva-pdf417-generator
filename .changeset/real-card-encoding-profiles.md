---
"aamva-pdf417-generator": minor
---

Support the wire format real credentials actually use, read off two decoded cards (Connecticut, AAMVA v09; New York, AAMVA v10).

**A payload can hold more than one subfile.** Both cards declare two directory entries — a `DL` subfile plus a jurisdiction-defined one (`ZC` on CT, `ZN` on NY). The generator wrote a hardcoded `01` and put the first subfile at a fixed offset of 31; the decoder read entry one and walked past the rest, so a scanned card silently lost its jurisdiction elements and re-encoding dropped them for good. The directory is now written and read for N entries, and the first subfile's offset follows from the entry count (41 with two entries, which is where both cards put it).

**The jurisdiction version is per-issuer.** It was hardcoded to `00` for all 55 jurisdictions. New York emits `04`. It now comes from the jurisdiction's encoding profile.

**Two elements were missing from the schema.** `DCK` (inventory control number, v03+) and `DDD` (limited duration document indicator, v08+). Both appear on real cards, so decoding one and re-encoding it lost them.

**Jurisdiction subfile values are no longer upper-cased.** NY's `ZNB` is an opaque mixed-case blob; applying the AAMVA text rule to it rewrote data whose meaning is not published anywhere.

**A feet-and-inches height is no longer "corrected" into nonsense.** NY writes 6'3" as `603`. The quick-fix read that as inches and offered to rewrite it `603 IN` — fifty feet — and "Fix all" applied it. Three-digit heights in the 4'0"–7'11" range are now left alone.

New `encoding` block on jurisdiction rule packs records where an issuer's wire format departs from the spec default: jurisdiction version, element order, whether `DAK` is space-filled to its fixed 11-character width, and any jurisdiction subfile. It is opt-in per jurisdiction, so the 53 jurisdictions with no decoded card keep the spec reading and their output is byte-identical to before. CT is recorded as emitting elements in its own order with an unpadded `DAK`; NY's element order turned out to match the schema default exactly, so nothing is recorded for it and the default is now confirmed rather than assumed.

The decoder now absorbs a few bytes of directory drift when reading. The CT card declares its `DL` subfile one byte longer than the bytes it contains, which pushes the declared offset of the following `ZC` subfile one past where `ZC` begins; rejecting it over two digits would fail the one jurisdiction with real evidence behind it. Strict mode keeps the exact arithmetic and additionally requires subfiles to be contiguous — the generator self-checks with it and never emits drift.

Also:

- Connecticut's document discriminator generator produces the observed 18-character issue-date-prefixed format instead of 9 digits, and `generateStateDiscriminator` takes the issue date so the two agree.
- New York's produces 10 alphanumeric characters instead of 10 digits.
- First `issued`-tier conformance vector (`ct-v09-dl-issued.json`, PII replaced), raising real-world jurisdiction coverage from 0 to 1. New York gets findings but no vector: its header declares a 323-byte `DL` subfile where the visible elements account for 224, and a vector whose bytes cannot be reconciled with its source would be a guess wearing an evidence label.
- Quick-fill presets for both issued layouts.
