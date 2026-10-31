---
"aamva-pdf417-generator": patch
---

Reproduce a decoded Colorado driver's license byte for byte, and fix the two schema gaps it exposed.

The card's directory adds up exactly — `DL` at 41 declaring 281 bytes, `ZC` at 322 declaring 10, 332 in all — and the generator matched none of it: it wrote jurisdiction version `00` where the card says `01`, one subfile where the card has two, schema order where Colorado has its own, a separator before each subfile's terminator that Colorado omits, and `065 IN` where the card says `065 in`. All of that is now in Colorado's encoding profile, and a new `issued` vector (`co-v10-dl-issued.json`, PII replaced in place in the decoded symbol) pins it. Real-world coverage goes from two jurisdictions to three.

The lower-case unit is not a Colorado quirk so much as the standard's own spelling: the 2009 edition's example for `DAU` is `"073 in"`, and nothing in it requires upper case for element values. This change records it for Colorado only. The quick fixes follow the same rule, so a Colorado card's own `065 in` is no longer offered a "fix" to `065 IN` that the encoder would only undo.

Two schema corrections, both read off the card:

- `DCJ` (audit information, `V25ANS`, optional) was missing from every version's field table. It is now on 04 through 10. Versions 03 and 11 are left without it because nobody has checked those editions, not because they are known to lack it.
- Colorado's field exclusions dropped `DCL`, which the card carries, space-filled to the standard's fixed three characters (`U  `).

`ZCA`'s help text no longer says "Connecticut": Colorado writes a `ZC` subfile too, because the standard names a jurisdiction subfile `Z` plus the jurisdiction's initial.
