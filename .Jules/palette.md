## 2025-05-14 - Character Counters & Text Scaling
**Learning:** Enforcing `maxLength` at the HTML level provides immediate "fail-fast" feedback. Using `aria-live="polite"` on character counters ensures screen reader users are aware of limits without being interrupted. Standardizing micro-text to `text-xs` (12px) instead of `text-[10px]` significantly improves legibility for users with visual impairments.
**Action:** Always combine `maxLength` with a visible counter in data-heavy forms. Position counters at the bottom-right of field containers to complement advisory messages at the bottom-left.

## 2025-05-15 - Interactive Diagnostics & Keyboard Focus
**Learning:** Mapping diagnostic reports (like validation errors or decoded field lists) directly to their corresponding form inputs via "jump-to-field" links significantly reduces cognitive load and manual searching. When making non-native elements (e.g., `li`, `tr`) interactive, providing explicit `focus-visible` ring styles is mandatory to maintain parity with native button accessibility.
**Action:** Use `role="button"` and `tabIndex={0}` on diagnostic items, and ensure they have visible focus indicators to support keyboard-only workflows.

## 2025-05-16 - Actionable Empty States & Modal Focus
**Learning:** Transform passive empty states (e.g., "Fill fields to see barcode") into actionable ones by adding "Fix" buttons that link directly to the first blocker. This reduces user friction and clarifies the "next step" in a complex form. Additionally, interactive components within modals (like the Welcome Tour) must explicitly save and restore focus upon unmounting to maintain keyboard navigation context and prevent the document focus from being "lost."
**Action:** Implemented a "Fix required fields" button in the `BarcodePreview` and added focus restoration logic to the `WelcomeTourBody` using `previousFocusRef`.
