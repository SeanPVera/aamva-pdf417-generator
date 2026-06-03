## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Stable Selectors & Mobile Panel Transitions
**Learning:** UX improvements that involve changing ARIA labels on established components can inadvertently break E2E test suites if those labels are used as primary locators. Additionally, mobile-optimized layouts with panel-based navigation (form vs. preview) require explicit state transitions and short stabilization delays (e.g., 100ms) in automated tests to prevent race conditions during element interaction.
**Action:** Before refactoring ARIA labels, audit E2E spec files for locator dependencies. When testing mobile-responsive views, utilize an `ensurePanel` helper to guarantee the target UI segment is visible and settled before performing actions.
