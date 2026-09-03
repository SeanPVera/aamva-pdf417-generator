---
"aamva-pdf417-generator": minor
---

Two preview affordances recovered from the stale PR backlog, reimplemented against current `main`.

- **Copying announces itself.** Copying the raw payload, the decoded JSON, or the barcode image raises a toast. Before this the only feedback was the button label flipping to "Copied!" for two seconds, which a sighted user watching that button saw and nobody else did. The toast carries `role="status"`, so it is announced.
- **The read-aloud button says which half of the toggle is live.** It now carries `aria-pressed`, and its label and tooltip switch between "Read decoded payload aloud" and "Stop reading payload aloud" instead of naming the action it is no longer offering.
