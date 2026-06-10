## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States
**Learning:** A "no results" state should never be a dead end. Providing a centered, visually distinct empty state (dashed border `border-gray-100`, circular icon `bg-gray-100`) with a clear "Clear all filters" CTA significantly reduces user frustration and provides a clear recovery path.
**Action:** Use the `bg-gray-50/50 dark:bg-dark-surface2/30` background and `border-dashed` pattern for empty results containers, ensuring a high-contrast action button is included to reset the state.
