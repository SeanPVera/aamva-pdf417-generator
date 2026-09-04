---
"aamva-pdf417-generator": minor
---

The last three affordances recovered from the stale PR backlog, reimplemented against current `main`.

- **Compare can load the form you are already working on.** Each side of the side-by-side view gets a "Use active form" button, so checking your work against a saved payload no longer means exporting it first. It writes the same shape the JSON export does, jurisdiction and version included, so both sides line up.
- **The batch dialog's strict-validation checkbox shows a keyboard focus ring.** It sits on the label, since that is the visible target, and is driven by the checkbox's `:focus-visible` so it stays off when the label is clicked.
- **The Version Browser's required and optional markers announce themselves.** They are bare "✓" and "—" glyphs, and an `aria-label` on a `<span>` with no role is not reliably honoured — a screen reader could read the raw character or nothing. They now carry `role="img"`, plus a tooltip giving sighted users the same word.
