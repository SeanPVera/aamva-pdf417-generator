## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States
**Learning:** Static "no results found" messages are dead ends that frustrate users. Providing a "Clear all filters" button or similar recovery action within the empty state helps users stay in their flow and explore the interface more effectively.
**Action:** Implement actionable empty states for all filtered lists or search results, ensuring high-contrast colors and descriptive guidance.
