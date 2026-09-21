---
"aamva-pdf417-generator": minor
---

Add Maine's encoding profile and conformance vector, decoded from an issued ID card — and fix the two bugs that card exposed.

The generator refused to build it at all. `DCA`, `DCB` and `DCD` were mandatory for every subfile type, but an identification card conveys no driving privileges and this one omits all three. `getMandatoryFields` now takes an optional `subfileType` and drops those codes for `"ID"`; it defaults to `"DL"`, so no existing caller changes behaviour.

Maine was also listed as excluding `DAW`, which the card plainly carries. That left the `ID` subfile seven bytes short of the card's 256 — the element, its value and its separator.

Neither bug was reachable from a synthetic vector. `il-v09-id-baseline.json` is also an `ID` card and carries `DCA`/`DCB`/`DCD` for the only reason a baseline ever carries anything: our own encoder demanded them.

Maine is the third jurisdiction with real-world evidence, after Connecticut and New York. Its element order turns out to be Connecticut's exactly, once the three vehicle-class codes and Maine's own `DAZ`/`DAW` are set aside — the first sign here that element order travels with a card-production system rather than being invented per jurisdiction. Its framing still differs: Maine closes the final element with the segment terminator alone, where Connecticut spends a byte on a trailing separator.
