## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Actionable Empty States & JSX Spacing
**Learning:** A basic text-only empty state for search results creates a "dead end" for users. Providing a centered, visual empty state with a "Clear all filters" CTA improves recoverability. Additionally, JSX conditional rendering for dynamic descriptions requires explicit `{" "}` spacing and template literals to avoid text concatenation errors (e.g., "matching'term'" vs "matching 'term'").
**Action:** Always include a reset action in search empty states and use explicit whitespace markers in conditional JSX strings to ensure grammatical correctness.
