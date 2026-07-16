## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-22 - Actionable Empty States & Filter Feedback
**Learning:** Generic 'No results' messages can be frustrating. An 'Actionable Empty State' that summarizes active filters (e.g., search terms and checkbox states) and provides a direct primary action to reset them significantly improves user recovery speed. Using smart quotes (`&lsquo;` / `&rsquo;`) for search terms and high-contrast spans for dynamic variables adds a necessary layer of visual polish.
**Action:** When implementing filterable views, always provide a rich empty state with a clear "Clear filters" action and dynamic, grammatically correct feedback on exactly what is being filtered.
