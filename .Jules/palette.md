## 2025-05-14 - Character Counters & Text Scaling
**Learning:** Enforcing `maxLength` at the HTML level provides immediate "fail-fast" feedback. Using `aria-live="polite"` on character counters ensures screen reader users are aware of limits without being interrupted. Standardizing micro-text to `text-xs` (12px) instead of `text-[10px]` significantly improves legibility for users with visual impairments.
**Action:** Always combine `maxLength` with a visible counter in data-heavy forms. Position counters at the bottom-right of field containers to complement advisory messages at the bottom-left.

## 2025-05-15 - Interactive Diagnostics & Keyboard Focus
**Learning:** Mapping diagnostic reports (like validation errors or decoded field lists) directly to their corresponding form inputs via "jump-to-field" links significantly reduces cognitive load and manual searching. When making non-native elements (e.g., `li`, `tr`) interactive, providing explicit `focus-visible` ring styles is mandatory to maintain parity with native button accessibility.
**Action:** Use `role="button"` and `tabIndex={0}` on diagnostic items, and ensure they have visible focus indicators to support keyboard-only workflows.

## 2025-05-16 - Collapsible Accessibility & Reactive Feedback
**Learning:** Implementing `aria-controls` on collapsible section triggers paired with unique IDs on the target content is essential for screen reader users to understand the relationship between the control and the section it toggles. Additionally, providing immediate visual feedback (like a brief CSS "flash") when fields are updated programmatically (e.g., auto-generation) helps users confirm that their action was successful and where the changes occurred.
**Action:** Always link collapsible triggers to their content via `aria-controls`. Use a reusable `flash` utility for non-manual data entries to provide interaction delight.
