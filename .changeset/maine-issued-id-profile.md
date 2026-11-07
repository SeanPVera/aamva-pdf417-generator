---
"aamva-pdf417-generator": patch
---

Add an opt-in observed encoding profile (`me-issued-v09`) and an anonymized issued vector for a Maine ID card layout, without changing default Maine generation.

The profile records what a decoded Maine identification card (AAMVA v09, IIN 636041) measured: jurisdiction version `00`, the issuer's element order (`DAQ` first, each name element beside its truncation flag, `DAZ`/`DAW` between `DCK` and `DDA`), an unpadded nine-digit `DAK`, no separator before each subfile terminator, and a `ZM` subfile written even though its only element, `ZMA`, is empty. Under the profile the encoder reproduced the source card's 303 bytes exactly before anonymization, and the app now recognizes that layout when a Maine ID is scanned or imported.

The profile is scoped to `ID`: the evidence is one identification card, and it says nothing about Maine driver's licences. `MIN_REAL_WORLD_JURISDICTIONS` goes from 15 to 16.
