## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Multi-state Search Empty States
**Learning:** When an interface has multiple active filters (e.g., search term + "required only" toggle), the empty state description must be contextually aware to remain helpful. Users need to know exactly which combination of filters led to zero results to make an informed decision on what to relax. Using high-contrast inline spans for active terms improves legibility in both light and dark modes.
**Action:** Always build multi-state empty descriptions that explicitly mention all active filtering criteria, and provide a single "Clear all" action to restore the UI to a known-good state.
