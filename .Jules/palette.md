## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Scoping E2E Locators for Complex Dialog Views
**Learning:** High-contrast toasts or other overlay messages that mirror user input actions can cause strict mode violations in Playwright tests if scoped too broadly. For instance, testing for loaded file state in a dialog will throw an error if a toast notification with the same text appears concurrently.
**Action:** Always scope Playwright locators using `.getByRole("dialog")` or `.getByRole("status")` specifically to prevent multi-element matching with toast components.
