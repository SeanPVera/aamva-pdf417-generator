## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-07-10 - Actionable Empty States
**Learning:** Replacing static "No results found" messages with actionable empty states (including icons, descriptive feedback on active filters, and a primary reset button) significantly reduces user friction. In filtered views, users often get "stuck" when a combination of search and toggles yields zero results; providing an immediate "Clear all filters" path within the empty state container (marked with `role="status"`) improves both usability and accessibility.
**Action:** Implement this pattern for all searchable or filterable list components to provide clear recovery paths.
