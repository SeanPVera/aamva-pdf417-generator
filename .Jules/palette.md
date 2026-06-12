## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-06-12 - Actionable Empty States & Transition Reliability
**Learning:** Plain text empty states in search results are missed opportunities for user guidance; adding a clear, actionable reset button improves flow. Additionally, complex mobile panel transitions often require a small delay (e.g., 100ms) even after `requestAnimationFrame` to ensure DOM elements are fully stable for focus and scroll operations.
**Action:** Always provide a "Clear all filters" button in search empty states and use a settled timeout for cross-panel navigation to avoid focus jank.

## 2026-06-12 - WebKit E2E Stability & Navigation Headroom
**Learning:** WebKit and mobile browsers in CI are significantly more sensitive to transition timing than Chromium; a 200ms settling delay after panel switches is often required to prevent flaky timeouts. Furthermore, hard-coded limits for keyboard navigation tests (like tab counts) must account for UI growth and platform-specific focusable elements to avoid false negatives.
**Action:** Always include a settling delay in mobile panel transition helpers and provide generous headroom for accessibility focus loops.
