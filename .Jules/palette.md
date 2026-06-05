## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States
**Learning:** For multi-filter interfaces like the AAMVA field list, a "no results" state is common but frustrating if it requires multiple clicks to undo. Providing a single "Clear all filters" button within the empty state container significantly improves recovery speed and reduces user friction compared to manual state reversal.
**Action:** Use the centered "Search icon + Heading + Reset Button" pattern for all filterable lists in the application to ensure search is never a dead-end.
