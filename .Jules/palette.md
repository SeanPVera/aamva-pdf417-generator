## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States
**Learning:** Generic 'No results' messages often lead to user dead-ends. Providing dynamic feedback that acknowledges active filters (e.g., specific search terms) and offering a primary action to reset them improves recovery paths and makes the interface feel more responsive and helpful.
**Action:** When implementing filters or search, always include a rich empty state with a clear "Clear filters" or "Reset" button.
