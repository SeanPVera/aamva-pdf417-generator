## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Responsive Panel Visibility & Locator Stability
**Learning:** In responsive layouts where content is split into mobile-only panels (e.g., Form vs. Preview), E2E tests must explicitly synchronize with panel transitions to avoid "element not found" or "not visible" errors. Additionally, using `aria-label` for descriptive instructions (like "pinch to zoom") can break brittle E2E locators and bloat screen reader output; the `title` attribute is more appropriate for supplemental context.
**Action:** Always call `ensurePanel` in E2E tests before interacting with elements on mobile viewports. Favor `title` over `aria-label` for non-essential interaction hints to maintain accessibility and test robustness.
