---
"aamva-pdf417-generator": minor
---

Three small affordances recovered from a stale PR backlog, reimplemented against current `main`.

- **Loaded payloads in Compare can be cleared individually.** Each side of the side-by-side view gets a clear button once a file is loaded, so swapping one payload no longer means reopening the modal. Clearing one side leaves the other intact, and a cleared side can be reloaded straight away.
- **Any field the user can type into now offers the clear button**, not just `DCF`, `DAQ`, and `DDB`. `DAJ` stays excluded — it is filled from the jurisdiction picker and is read-only.
- **The Version Browser's toggle and version select show a keyboard focus ring**, matching the focus treatment used elsewhere in the app.
