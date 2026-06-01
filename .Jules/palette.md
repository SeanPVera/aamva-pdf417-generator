## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States with Recovery Paths
**Learning:** In complex form interfaces with multiple filtering layers (search + required toggles), static "No results" messages can leave users feeling stuck. An actionable empty state that provides a single-click "Clear all filters" button significantly reduces friction and cognitive load for recovery.
**Action:** When implementing filters or search, always accompany zero-match states with a visually distinct, centered component that includes a primary action to reset the filter state.
