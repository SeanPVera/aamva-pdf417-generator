## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-08-09 - Payload Comparison Clears & Focus Indicators
**Learning:** In two-pane / comparative dashboard views, loading persistent states individually (like comparison file payloads) can lead to modal trapping if users can't easily undo or clear one of the loaded sides. Providing an independent clear button on each slot resolves this flow frustration. Additionally, focus-visible classes are absolutely critical on standard HTML controls like selects/checkboxes within customized UI tables.
**Action:** Always include independent clear triggers for loaded/compaired files, and verify native elements (like selects and checkboxes) inside customized panels have robust `focus-visible:` utility ring styling.
