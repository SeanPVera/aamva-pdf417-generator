---
"aamva-pdf417-generator": minor
---

Add a byte ledger for decoded payloads, so "where did every byte go" is a question the app answers instead of one you reason about.

The decoded table says what a card contains. It cannot say what a card's bytes add up to, and those come apart on real credentials. A decoded New York card declares a 323-byte `DL` subfile whose visible elements account for 224 — and from a list of name/value pairs there is no way to tell whether the missing bytes are fixed-width padding the reader stripped or elements its table has no name for. Both are invisible in a field dump and both are obvious in a ledger.

`inspectPayload` in the new `src/core/inspect.ts` reports, per subfile: the declared offset and length, the bytes its parsed elements actually account for, what is left unaccounted, and whether the directory offset needed repairing on read. Per element it reports the value as it sits on the wire alongside the value after padding is stripped, so space-filling is visible rather than inferred. Codes outside the version's field table are listed separately — with `Z*` jurisdiction elements excluded, since AAMVA defines nothing inside those and "not in the table" is their normal condition.

Surfaced as a **Wire Ledger** panel in the payload inspector, next to the decoded output. It badges Balanced or Check without being opened.

Crucially it inspects the **source card**, not this app's re-encoding of it. A scan or a paste now keeps the AAMVA bytes it carried (`sourcePayload` on the form store), because regenerating from the form discards precisely the padding and unrecognised elements the ledger exists to surface — pointed at our own output it would balance by construction and could never say anything about a credential. A toggle switches between the two so they can be compared. The bytes are never persisted (`partialize` is an allow-list) and are cleared with the form.

Inspection deliberately does not share a code path with decoding: decoding answers what the card says, inspection answers what is in the bytes, and putting diagnostic detail in the path every scan takes would be the wrong trade. `readDirectory` gains an overrun cap so the inspector can read a subfile that declares far more than it holds — the exact anomaly it measures — while the decoder keeps absorbing only a few bytes of drift.

Negligible first-paint cost: the panel rides in the already-lazy preview chunk, and the initial bundle moves 45.06 → 45.12 kB against a 46 kB budget.
