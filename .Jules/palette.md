## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-05-31 - Actionable Empty States & Filter Context
**Learning:** When implementing an empty state for a filtered view, the message should adapt to the active filters to provide specific context. A generic "no results for ''" message is unpolished and confusing. Providing a single-click "Clear all filters" action is significantly more effective for user recovery than forcing manual resets of multiple individual filters.
**Action:** Always use conditional logic to tailor empty state copy to the active filter set and include a prominent "Clear all" recovery path.
