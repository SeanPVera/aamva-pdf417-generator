## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2025-10-24 - Dropdowns & Secondary Collapsibles Focus Indicators
**Learning:** Collapsible components and form controls in auxiliary views (such as sidebars or drawers) can easily bypass focus styling, leaving them dependent on browser-default focus indicators. In complex web apps with dark/light variations and state-specific theme modes, this breaks visual coherence and degrades accessibility.
**Action:** Always explicitly define `focus-visible` outlines/rings (such as `focus-visible:ring-brand-500`) for all collapsible toggles and `<select>` drop-downs, even in nested panel components, to keep visual contrast and brand aesthetic consistent across themes.
