---
"aamva-pdf417-generator": minor
---

Two preview affordances recovered from the stale PR backlog, reimplemented against current `main`.

- **Copying announces itself.** Copying the raw payload, the decoded JSON, or the barcode image raises a toast. Before this the only feedback was the button label flipping to "Copied!" for two seconds, which a sighted user watching that button saw and nobody else did. The toast carries `role="status"`, so it is announced.
- **The read-aloud button's tooltip follows the action it is offering.** While speaking it described reading, the thing it had already started. It is a command button that swaps commands rather than a toggle, so the visible text stays its accessible name and the tooltip carries the longer description.
