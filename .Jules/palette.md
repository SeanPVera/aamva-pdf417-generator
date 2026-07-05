## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States for Multi-Filter Views
**Learning:** In highly technical forms with multiple concurrent filters (e.g., text search + "Required Only" toggle), a generic "No results" message creates a dead-end. Providing a dynamic explanation of *why* the view is empty (identifying which specific filters are active) combined with a primary action to reset all filters significantly improves user recovery and reduces frustration.
**Action:** Implement actionable empty states using a combination of descriptive text (identifying active filters) and a "Clear all filters" button for any searchable list or grid. Use high-contrast spans for search terms to ensure visibility against themed backgrounds.
