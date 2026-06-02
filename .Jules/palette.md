## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-05-15 - Dark Mode Contrast on Elevated Surfaces
**Learning:** Standard gray text (like `text-gray-400`) that works well on deep black backgrounds can lose legibility on "elevated" surfaces (e.g., `dark:bg-dark-surface2`) due to the lighter surface color. Description text in empty states needs higher contrast (e.g., `text-gray-100` or `white`) to remain WCAG-compliant on these secondary dark surfaces.
**Action:** When designing for dark mode, verify contrast ratios specifically against elevated/surface-2 backgrounds, not just the base background. Use lighter text colors to maintain contrast against lighter dark-mode surfaces.
