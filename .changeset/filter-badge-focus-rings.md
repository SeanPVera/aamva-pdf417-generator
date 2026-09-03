---
"aamva-pdf417-generator": minor
---

**The two field filter badges show a keyboard focus ring.** Tabbing to "Required only" or "Issues only" previously moved focus to a checkbox 3.5 units square with no visible indicator on the badge around it.

The ring is driven by the checkbox's `:focus-visible`, so it appears for keyboard users and stays off when the badge is clicked, matching how the rest of the app indicates focus. Its color follows the badge rather than sitting at brand blue in every state: the issues badge rings red while it has issues to show and matches its red border, and falls back to brand once it is empty and disabled. The redundant ring on the inner checkbox is gone, so the indicator draws once instead of twice.
