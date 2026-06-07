## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States & Contrast
**Learning:** Empty states for search or filter results should be actionable rather than just informative. Providing a "Clear all filters" button reduces the distance to recovery. Additionally, when placing descriptive text on elevated surfaces in dark mode (e.g., `dark:bg-dark-surface2`), standard gray text can fall below WCAG contrast ratios; using `dark:text-gray-100` ensures accessibility while maintaining visual hierarchy.
**Action:** Always include a recovery action in empty states and audit contrast ratios specifically on non-default background colors.
