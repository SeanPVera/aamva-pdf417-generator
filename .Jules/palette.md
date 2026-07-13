## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-07-13 - Jurisdiction Theming and Contrast Resilience
**Learning:** The application's jurisdiction theming system (e.g., DMV mode) uses `!important` CSS rules to force specific surface colors like `var(--state-surface)` (often white) even when the global theme is set to Dark Mode. This means UX additions in the main content area cannot rely solely on Tailwind's `dark:` classes for text contrast.
**Action:** For UI elements within themed containers, use high-contrast text classes (e.g., `text-gray-900` or `text-gray-600`) that are legible against white backgrounds by default, rather than assuming dark mode will provide a dark background.
