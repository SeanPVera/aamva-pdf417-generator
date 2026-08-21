## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Comparison View In-Memory Form Bridge
**Learning:** In side-by-side payload comparison tools, requiring users to export their active form to disk before loading it back into a compare slot creates unnecessary steps and file clutter. Providing an in-memory "Use active form" shortcut inside compare slots bridges generator state directly to comparison views while keeping non-empty schema filtering intact.
**Action:** When adding comparison or diff tools for stateful forms, include a one-click action to load active in-memory form fields directly into comparison slots.
