## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Live Region Feedback in Filtered Tables
**Learning:** In table-based search filters (like `VersionBrowser`), screen readers often miss dynamic row updates unless both the matching summary count is wrapped in an `aria-live` container (e.g., `aria-live="polite"`) and the empty result row/cell explicitly uses `role="status"`.
**Action:** Always add `aria-live="polite"` to filter summary counters and `role="status"` to empty search result table cells.
