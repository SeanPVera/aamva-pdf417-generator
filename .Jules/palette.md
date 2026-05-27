## 2025-05-14 - Character Counters & Text Scaling
**Learning:** Enforcing `maxLength` at the HTML level provides immediate "fail-fast" feedback. Using `aria-live="polite"` on character counters ensures screen reader users are aware of limits without being interrupted. Standardizing micro-text to `text-xs` (12px) instead of `text-[10px]` significantly improves legibility for users with visual impairments.
**Action:** Always combine `maxLength` with a visible counter in data-heavy forms. Position counters at the bottom-right of field containers to complement advisory messages at the bottom-left.

## 2025-05-15 - Interactive Diagnostics & Keyboard Focus
**Learning:** Mapping diagnostic reports (like validation errors or decoded field lists) directly to their corresponding form inputs via "jump-to-field" links significantly reduces cognitive load and manual searching. When making non-native elements (e.g., `li`, `tr`) interactive, providing explicit `focus-visible` ring styles is mandatory to maintain parity with native button accessibility.
**Action:** Use `role="button"` and `tabIndex={0}` on diagnostic items, and ensure they have visible focus indicators to support keyboard-only workflows.

## 2025-05-27 - Actionable Empty States
**Learning:** UX enhancements should prioritize making empty states actionable rather than just informative. When a user is blocked by missing data, providing a direct "Fix" button that navigates them to the specific missing fields significantly reduces friction and improves the "time-to-success" for the primary task.
**Action:** Always look for opportunities to turn static error messages into actionable guides that use existing navigation helpers (like `scrollToField`) to assist the user.
