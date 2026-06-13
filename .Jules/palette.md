## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Search Empty States
**Learning:** A static "No results" message is a dead-end for users. Implementing an actionable empty state with a "Clear all filters" button provides a clear recovery path, especially when multiple overlapping filters (like search query + 'Required only' toggle) might be causing the empty result set.
**Action:** Use a centered layout with a dashed border, a circular icon background, and a high-contrast action button for search results to maintain consistency with the app's established design system.
