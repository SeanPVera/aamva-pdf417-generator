## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States
**Learning:** The repository utilizes an 'Actionable Empty State' pattern for filter views: instead of generic 'No results' messages, the UI provides dynamic feedback on active filters and a clear primary action button to reset them, improving user recovery paths.
**Action:** When implementing list or grid views with filtering, always provide a descriptive empty state that names the active filters and offers a single-click "Clear all" or "Reset" action.
