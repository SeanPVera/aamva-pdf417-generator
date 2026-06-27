## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-06-27 - Actionable Search Empty States
**Learning:** A "no results found" state is a prime opportunity for proactive assistance. Instead of a static message, providing an actionable empty state that mirrors the active filters and offers a one-click reset ("Clear all filters") significantly reduces friction in multi-state filtering UIs. Combining this with high-contrast spans for active search terms ensures the state is both legible and informative.
**Action:** Always implement an actionable reset button in empty states triggered by user-controlled filters, and echo the current filter state in the description to provide clear context.
