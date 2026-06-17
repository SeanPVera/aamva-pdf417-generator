## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States
**Learning:** In applications with multiple concurrent filters (e.g., search query + "Required only" toggle), a passive empty state ("No results") forces users to manually find and reset each filter. An actionable empty state with a "Clear all" button provides a 1-click recovery path, significantly reducing interaction friction.
**Action:** For all searchable or filterable lists, implement an actionable empty state that resets all active filters to their default values.
