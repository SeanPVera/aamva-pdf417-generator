# Design directions

Working files for a redesign of the app shell. Each `*.dc.html` is one artboard
in a Claude Design canvas; `canvas.json` lays them out and carries the note text
shown beside each frame. They are drafts, not shipped code — nothing here is
imported by the app or the build.

To rebuild the canvas after editing an artboard, re-seed all six files together
(the seeded output is ~2.5 MB of baked editor and is deliberately not committed —
see `.gitignore`).

## What the redesign is answering

Measured against `main` at `15e802b`, on a fresh load with California selected
and no fields touched. All three are faults, not preferences:

| Fault | Measurement |
|---|---|
| White toolbar text on the header gradient | The bar runs `linear-gradient(127deg, #00264A 0%, #003A70 48%, #F2A900 100%)`. `Export JSON` sits at x≈966 of 1440 — over the gold. White on `#F2A900` is **2.0:1**; AA wants 4.5:1. Every control right of centre fails, `Clear PII` included. |
| Header toolbar hierarchy | **15 controls** in one flat horizontally-scrolling row. `Clear PII` carries the same visual weight as `Export JSON`. |
| Mobile chrome before the first input | **347px of an 844px viewport — 41%** (header 84 + panel nav 69 + panel heading + a six-row filter bar). |
| Alarm on an untouched form | **174 red-coloured text nodes**, a `20 errors` count, and five red group chips, before the user has typed anything. Empty is being rendered as wrong. |

The last one is the important one. Empty and invalid are different states and the
current design collapses them, so the form opens hostile and the red carries no
information by the time something is actually wrong.

## The five directions

| File | Name | Thesis | Main cost |
|---|---|---|---|
| `Main.dc.html` | Civic Modern | Keep the government identity, execute it correctly. Solid navy bar, state colour demoted to a 3px rule and a plate, actions on a white sub-bar in three labelled groups. | Safe. Nothing here is surprising. |
| `Instrument.dc.html` | Instrument | The payload is the product. Dark, dense, monospace; fields become a table, and the right half becomes the byte ledger `core/inspect.ts` already computes and nothing surfaces. | Drops the DMV character entirely; a table degrades badly on a phone. |
| `Ledger.dc.html` | Ledger | Paper, not software. Ruled entry lines, numbered sections, rules and type instead of cards and shadows. | Lowest density of the five. Reads as a document rather than a tool. |
| `Kiosk.dc.html` | Kiosk | Changes structure, not paint. One section at a time behind a step rail, 56px controls. The only direction that fixes the 41% figure at the root. | Loses the whole-form view and find-across-all-fields. Largest build. |
| `Laminate.dc.html` | Laminate | Full commitment to the DMV register: guilloche, security-print sheen, numbered form boxes, the preview rendered as the card front. | Loud, hardest to keep accessible, and it edges toward resembling the credential rather than a tool that produces one — which cuts against the posture the rest of the project keeps (memory-only fields, no persisted PII). |

Every direction is drawn from the real tokens rather than invented: the CA palette
from `src/core/stateThemes.ts` (`#00264A` / `#003A70` / `#F2A900`), the brand ramp
and `shadow-google` from `tailwind.config.js`, and the 3-column field grid from
`src/components/FieldGroup.tsx`.

Barcodes in the artboards are CSS patterns standing in for a render. Fonts come
from Google Fonts with system fallbacks, so PNG/PDF export of an artboard shows
the fallback face.
