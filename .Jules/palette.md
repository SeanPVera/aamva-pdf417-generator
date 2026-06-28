## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States for Multi-Filter Results
**Learning:** When users apply multiple filters (like search + toggles), a generic "no results" message is frustrating. Providing a specific description of what was filtered out (e.g., "No fields matching 'term' and Required filters") combined with a single-click "Clear all filters" button significantly reduces friction and helps users recover their context quickly.
**Action:** Use the standard centered dashed-border container for empty states and always include a dynamic summary of active filters and a primary reset action.
