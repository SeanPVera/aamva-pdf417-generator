## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-05-31 - Context-Aware Actionable Empty States
**Learning:** Empty search states are often a UX dead-end. Providing a "Clear all filters" recovery path that resets multiple filtering states (e.g., search query + toggles) significantly improves task recovery speed. Using high-contrast text for these states is critical as they may be rendered against dynamic, state-themed background tints that vary in brightness.
**Action:** Replace basic "No results" text with stylized empty states that include a context-aware description and a high-contrast recovery button. Ensure these components follow the project's dashed-border pattern for consistency.
