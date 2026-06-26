## 2025-05-15 - Actionable Empty States
**Learning:** Basic "No results" text provides a dead-end for users. An actionable empty state with a "Clear all filters" button and specific feedback on which filters are active (e.g., search terms and toggles) significantly improves usability by providing a clear path forward. Dynamically constructing the description string ensures the UI feels responsive to the user's current context.
**Action:** When implementing filtering interfaces, always include a high-contrast action to reset the state and provide clear, dynamic feedback about the active criteria to help users understand why no results are appearing.

## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.
