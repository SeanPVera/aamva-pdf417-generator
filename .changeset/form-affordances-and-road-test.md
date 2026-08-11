---
"aamva-pdf417-generator": minor
---

Ten form affordances that remove transcription busywork, plus a parallel-parking examination that removes nothing at all.

**Entry**

- Paste a raw AAMVA payload or a JSON profile anywhere on the page (⌘/Ctrl+V). The app could already take a payload from a file picker, a drag-drop, and a webcam — but not from the clipboard, which is how a payload actually travels between tools. Unknown keys are dropped rather than loaded, and pasting over a filled form offers Undo.
- Date fields accept `8/11/2026`, `2026-08-11`, and `08112026`, folding to the wire format on blur rather than mid-keystroke. Two-digit years resolve against a `current year + 10` pivot, and only from separated input — a bare digit run is never padded, because that would invent digits nobody typed.
- Date fields show what the eight digits mean (`Aug 11, 2026`, plus age at issue for `DBB`), so a transposed year is visible before it reaches the barcode.
- Empty date fields offer the values worth one click instead of arithmetic: today for the issue date, `+4`/`+8` years **from the issue date** for the expiry, plausible adult birth dates, and "match issue" for the card revision date.
- String, char, and zip fields are upper-cased as you type. `generateAAMVAPayload` upper-cases them on the way out regardless, so the form was showing something the barcode would not contain.

**Repair**

- Quick fixes rewrite values the validator rejects, in one click: `brown` → `BRO`, `8/11/1990` → `08111990`, `a1234567` → `A1234567`, `5 ft 9 in` → `069 IN`. A fix is only offered once the rewritten value has been checked against `evaluateFieldValue`, and never for an empty field — a repair rewrites what the user typed, it never invents data. The validation report also gets a "Fix N" button that applies every available rewrite at once.
- `DAJ` is filled from the selected jurisdiction and shown read-only. The generator already forced it to the state code, so it was a required field nobody could satisfy: the progress meter was permanently short and "next empty required" sent you to an input whose value could never matter.

**Navigation and output**

- A group navigator strip above the form shows each group's error count and outstanding required fields, and jumps to it. A v10 schema is thirty-odd fields across five collapsible groups, and finding the two errors down in Driving Privileges previously meant scrolling.
- Search matches are highlighted in field labels, and Escape inside the search box clears the query, then the filters.
- Single-payload PDF export, at the credential's physical size with a print-at-100% note. The batch tool could already emit PDFs; the single payload could not, despite the docs saying otherwise. jsPDF stays lazily imported, so PNG and SVG exports do not pay for it.
- A sticky mobile status bar reports whether the barcode is ready — and exports it — without switching panels. On phones the three panels are mutually exclusive, so the form previously gave no sign of readiness and the export buttons lived one tab away.

**And, unnecessarily**

- **The Road Test.** Under Playful extras, a complete behind-the-wheel parallel-parking examination: a kinematic-bicycle-model vehicle with a wheelbase and self-centring steering, two parked cars with separating-axis collision, four cones, a curb, a 150-second clock, and an examiner who itemises your deductions on a score sheet ("Parked 12° off parallel, -10"; "Struck 1 cone, -15"; "Failed to signal before manoeuvring, -5") before delivering a single flat remark. Passing marks a bingo square and changes nothing else. The physics, the measurements, and the scoring are pure functions in `src/core/roadTest.ts` and are unit tested; the component only draws. It is lazy-loaded, so a user who never opens it never downloads it.

The `Initial JS` size budget moves from 40 kB to 45 kB (measured: 43.93 kB gzipped) to cover the first-paint affordances above. The road test, the PDF exporter, and every modal remain outside the initial chunk.
