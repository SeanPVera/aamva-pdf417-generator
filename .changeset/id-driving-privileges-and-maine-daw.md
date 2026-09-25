---
"aamva-pdf417-generator": patch
---

Stop demanding driving-privilege elements of an ID card on the older AAMVA editions, and correct Maine's field exclusions.

`DCA`, `DCB` and `DCD` describe driving privileges an identification card does not confer. Versions 10 and 11 already drop them from an `ID` subfile per CDS Table D.3; the earlier editions were left demanding them pending primary-source review. A decoded Maine ID card (AAMVA v09) is that source — it omits all three, and the generator refused to build the payload at all.

Those editions do still define the elements, and Illinois's v09 ID vector carries them, so this stops them being *demanded* rather than removing them as v10/v11 do. An ID card that carries a vehicle class can still say so; one that does not is no longer refused. Requiredness is cleared on the field list itself, which is where validation, the readiness counts and the progress bar all read it — scoping it anywhere narrower would leave those disagreeing with the generator about the same record.

Separately, Maine was listed as excluding `DAW`. A decoded Maine ID card carries it, and excluding the element cost the subfile its code, its value and its separator.
